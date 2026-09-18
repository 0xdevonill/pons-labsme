"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { LaunchRecord } from "@/lib/types";
import { v1TokenAbi, v2CurveAbi, v2FactoryAbi, v2TokenAbi } from "@/lib/contracts/abis";
import { V2_FACTORY } from "@/lib/contracts/addresses";
import { PHASE_LABEL, type GraduationPhase } from "@/lib/types";
import { graduationProgress } from "@/lib/quote";

export type LaunchExtra = {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  progress: number;
  phaseLabel: string;
};

export function useLaunchMeta(launches: LaunchRecord[], limit = 48) {
  const client = usePublicClient();
  const slice = launches.slice(0, limit);

  return useQuery({
    queryKey: ["launch-meta", slice.map((l) => l.token.toLowerCase()).join(",")],
    enabled: Boolean(client && slice.length),
    staleTime: 30_000,
    queryFn: async () => {
      if (!client) return {} as Record<string, LaunchExtra>;

      const contracts = slice.flatMap((launch) => {
        const abi = launch.generation === "v2" ? v2TokenAbi : v1TokenAbi;
        const reads = [
          { address: launch.token, abi, functionName: "name" as const },
          { address: launch.token, abi, functionName: "symbol" as const },
          { address: launch.token, abi, functionName: "getTokenInfo" as const },
        ];
        if (launch.generation === "v2" && launch.curve) {
          reads.push(
            {
              address: V2_FACTORY,
              abi: v2FactoryAbi,
              functionName: "getLaunchedToken" as const,
              args: [launch.token],
            } as never,
            {
              address: launch.curve,
              abi: v2CurveAbi,
              functionName: "realQuoteReserve" as const,
            } as never,
          );
        }
        return reads;
      });

      const results = await client.multicall({ contracts, allowFailure: true });
      const extras: Record<string, LaunchExtra> = {};
      let cursor = 0;

      for (const launch of slice) {
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
    },
  });
}
