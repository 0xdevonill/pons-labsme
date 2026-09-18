"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LOOKBACK, parseLaunchRecord, type SerializedLaunch } from "@/lib/indexer";
import type { Generation, LaunchRecord } from "@/lib/types";
import type { Address } from "viem";

export function useLaunches(opts?: {
  generation?: Generation | "all";
  deployer?: Address;
  lookback?: bigint;
  enabled?: boolean;
}) {
  const lookback = opts?.lookback ?? DEFAULT_LOOKBACK;
  const generation = opts?.generation ?? "all";
  const deployer = opts?.deployer;

  return useQuery({
    queryKey: ["launches", generation, deployer ?? "any", lookback.toString()],
    enabled: opts?.enabled !== false,
    staleTime: 15_000,
    queryFn: async () => {
      const params = new URLSearchParams({
        generation,
        lookback: lookback.toString(),
      });
      if (deployer) params.set("deployer", deployer);
      const res = await fetch(`/api/tokens?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || "Failed to index launches");
      }
      const json = (await res.json()) as {
        fromBlock: string;
        toBlock: string;
        launches: SerializedLaunch[];
      };
      return {
        launches: json.launches.map(parseLaunchRecord),
        fromBlock: BigInt(json.fromBlock),
        toBlock: BigInt(json.toBlock),
      };
    },
  });
}

export function mergeLaunches(primary: LaunchRecord[], extra: LaunchRecord[]) {
  const map = new Map<string, LaunchRecord>();
  for (const item of [...extra, ...primary]) {
    map.set(item.token.toLowerCase(), item);
  }
  return [...map.values()].sort((a, b) => Number(b.blockNumber - a.blockNumber));
}
