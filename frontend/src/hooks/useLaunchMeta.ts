"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { LaunchRecord } from "@/lib/types";
import { v1TokenAbi, v2CurveAbi, v2FactoryAbi, v2TokenAbi } from "@/lib/contracts/abis";
import { V2_FACTORY } from "@/lib/contracts/addresses";
import { PHASE_LABEL, type GraduationPhase } from "@/lib/types";
import { graduationProgress } from "@/lib/quote";

export function useLaunchMeta(launches: LaunchRecord[], limit = 48) {
  const client = usePublicClient();
  const slice = launches.slice(0, limit);

  return useQuery({
    queryKey: ["launch-meta", slice.map((l) => l.token).join(",")],
    enabled: Boolean(client && slice.length),
    queryFn: async () => {
      if (!client) return {};
      const entries = await Promise.all(
        slice.map(async (launch) => {
          try {
            const abi = launch.generation === "v2" ? v2TokenAbi : v1TokenAbi;
            const [name, symbol, info] = await Promise.all([
              client.readContract({ address: launch.token, abi, functionName: "name" }),
              client.readContract({ address: launch.token, abi, functionName: "symbol" }),
              client.readContract({ address: launch.token, abi, functionName: "getTokenInfo" }),
            ]);
            let progress = 0;
            let phaseLabel = launch.generation === "v1" ? "Uniswap V3" : "Bonding";
            if (launch.generation === "v2" && launch.curve) {
              const [record, real] = await Promise.all([
                client.readContract({
                  address: V2_FACTORY,
                  abi: v2FactoryAbi,
                  functionName: "getLaunchedToken",
                  args: [launch.token],
                }),
                client.readContract({
                  address: launch.curve,
                  abi: v2CurveAbi,
                  functionName: "realQuoteReserve",
                }).catch(() => 0n),
              ]);
              progress = graduationProgress(real, record.graduationThreshold);
              phaseLabel = PHASE_LABEL[record.phase as GraduationPhase] ?? "Bonding";
            }
            return [
              launch.token.toLowerCase(),
              {
                name,
                symbol,
                logo: info[1],
                description: info[2],
                progress,
                phaseLabel,
              },
            ] as const;
          } catch {
            return [
              launch.token.toLowerCase(),
              { name: "", symbol: "", logo: "", description: "", progress: 0, phaseLabel: launch.generation },
            ] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
  });
}
