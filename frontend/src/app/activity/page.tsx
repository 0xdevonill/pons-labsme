"use client";

import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { V1_FACTORY, V2_FACTORY, explorerTx, pairSymbol } from "@/lib/contracts/addresses";
import { v1TokenLaunchedEvent, v2TokenLaunchedEvent } from "@/lib/contracts/abis";
import { DEFAULT_LOOKBACK } from "@/lib/indexer";
import { shorten } from "@/lib/format";
import Link from "next/link";

export default function ActivityPage() {
  const { address } = useAccount();
  const client = usePublicClient();

  const query = useQuery({
    queryKey: ["activity", address ?? "all"],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > DEFAULT_LOOKBACK ? latest - DEFAULT_LOOKBACK : 0n;
      const [v2, v1] = await Promise.all([
        client.getLogs({
          address: V2_FACTORY,
          event: v2TokenLaunchedEvent,
          args: address ? { deployer: address } : undefined,
          fromBlock,
          toBlock: latest,
        }),
        client.getLogs({
          address: V1_FACTORY,
          event: v1TokenLaunchedEvent,
          args: address ? { deployer: address } : undefined,
          fromBlock,
          toBlock: latest,
        }),
      ]);
      return [
        ...v2.map((log) => ({
          generation: "v2" as const,
          token: log.args.token!,
          pair: log.args.pairToken!,
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
        ...v1.map((log) => ({
          generation: "v1" as const,
          token: log.args.token!,
          pair: log.args.pairToken!,
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
      ].sort((a, b) => Number(b.blockNumber - a.blockNumber));
    },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">Transaction history</h1>
      <p className="mt-2 mb-6 text-[var(--muted)]">
        Recent factory launches{address ? " for the connected wallet" : ""}. Open a token for curve buys and sells.
      </p>
      <div className="space-y-2">
        {query.data?.map((row) => (
          <div key={row.hash} className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
            <Link href={`/token/${row.token}`} className="font-medium">
              {row.generation.toUpperCase()} {shorten(row.token)}
            </Link>
            <span className="text-[var(--muted)]">{pairSymbol(row.pair)}</span>
            <a href={explorerTx(row.hash)} target="_blank" rel="noreferrer" className="text-[var(--muted)]">
              {shorten(row.hash, 6)}
            </a>
          </div>
        ))}
        {query.data?.length === 0 ? <p className="text-[var(--muted)]">No launches in this window.</p> : null}
      </div>
    </div>
  );
}
