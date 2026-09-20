import type { Address } from "viem";
import type { LaunchRecord } from "./types";
import { v1TokenAbi, v2CurveAbi, v2FactoryAbi, v2TokenAbi } from "./contracts/abis";
import { V2_FACTORY } from "./contracts/addresses";
import { PHASE_LABEL, type GraduationPhase } from "./types";
import { graduationProgress } from "./quote";
import { makeRpcClient, withRetries } from "./rpc";

export type LaunchExtra = {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  progress: number;
  phaseLabel: string;
};

export async function loadLaunchMeta(launches: LaunchRecord[]): Promise<Record<string, LaunchExtra>> {
  if (!launches.length) return {};
  const client = makeRpcClient();

  return withRetries(async () => {
    const contracts = launches.flatMap((launch) => {
      const abi = launch.generation === "v2" ? v2TokenAbi : v1TokenAbi;
      const reads: Array<{
        address: Address;
        abi: typeof abi | typeof v2FactoryAbi | typeof v2CurveAbi;
        functionName: string;
        args?: readonly unknown[];
      }> = [
        { address: launch.token, abi, functionName: "name" },
        { address: launch.token, abi, functionName: "symbol" },
        { address: launch.token, abi, functionName: "getTokenInfo" },
      ];
      if (launch.generation === "v2" && launch.curve) {
        reads.push(
          { address: V2_FACTORY, abi: v2FactoryAbi, functionName: "getLaunchedToken", args: [launch.token] },
          { address: launch.curve, abi: v2CurveAbi, functionName: "realQuoteReserve" },
        );
      }
      return reads;
    });

    const results = (await client.multicall({
      contracts: contracts as Parameters<typeof client.multicall>[0]["contracts"],
      allowFailure: true,
    })) as Array<{ status: "success" | "failure"; result?: unknown }>;
    const extras: Record<string, LaunchExtra> = {};
    let cursor = 0;

    for (const launch of launches) {
      const nameRes = results[cursor++];
      const symbolRes = results[cursor++];
      const infoRes = results[cursor++];
      let progress = 0;
      let phaseLabel = launch.generation === "v1" ? "Uniswap V3" : "Bonding";

      if (launch.generation === "v2" && launch.curve) {
        const recordRes = results[cursor++];
        const realRes = results[cursor++];
        const record =
          recordRes.status === "success"
            ? (recordRes.result as unknown as { graduationThreshold: bigint; phase: number })
            : null;
        const real = realRes.status === "success" ? (realRes.result as unknown as bigint) : 0n;
        if (record) {
          progress = graduationProgress(real, record.graduationThreshold);
          phaseLabel = PHASE_LABEL[record.phase as GraduationPhase] ?? "Bonding";
        }
      }

      const info = infoRes.status === "success" ? (infoRes.result as readonly unknown[]) : null;
      extras[launch.token.toLowerCase()] = {
        name: nameRes.status === "success" ? String(nameRes.result) : "",
        symbol: symbolRes.status === "success" ? String(symbolRes.result) : "",
        logo: info && typeof info[1] === "string" ? info[1] : "",
        description: info && typeof info[2] === "string" ? info[2] : "",
        progress,
        phaseLabel,
      };
    }

    return extras;
  });
}
