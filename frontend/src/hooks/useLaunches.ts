"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { DEFAULT_LOOKBACK, fetchLaunchLogs } from "@/lib/indexer";
import type { Generation, LaunchRecord } from "@/lib/types";
import type { Address } from "viem";

export function useLaunches(opts?: {
  generation?: Generation | "all";
  deployer?: Address;
  lookback?: bigint;
  enabled?: boolean;
}) {
  const client = usePublicClient();
  const lookback = opts?.lookback ?? DEFAULT_LOOKBACK;

  return useQuery({
    queryKey: [
      "launches",
      opts?.generation ?? "all",
      opts?.deployer ?? "any",
      lookback.toString(),
    ],
    enabled: Boolean(client) && opts?.enabled !== false,
    queryFn: async () => {
      if (!client) throw new Error("No client");
      const latest = await client.getBlockNumber();
      const fromBlock = latest > lookback ? latest - lookback : 0n;
      const launches = await fetchLaunchLogs(client, {
        generation: opts?.generation,
        deployer: opts?.deployer,
        fromBlock,
        toBlock: latest,
      });
      return { launches, fromBlock, toBlock: latest };
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
