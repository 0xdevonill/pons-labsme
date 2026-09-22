"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { curveBuyEvent, curveSellEvent } from "@/lib/contracts/abis";
import { formatAmount, shorten } from "@/lib/format";
import { explorerTx, pairDecimals, pairSymbol } from "@/lib/contracts/addresses";
import { DEFAULT_LOOKBACK } from "@/lib/indexer";

export function TxHistory({
  curve,
  pairToken,
}: {
  curve?: Address;
  pairToken: Address;
}) {
  const client = usePublicClient();
  const decimals = pairDecimals(pairToken);

  const query = useQuery({
    queryKey: ["curve-txs", curve],
    enabled: Boolean(client && curve),
    queryFn: async () => {
      if (!client || !curve) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > DEFAULT_LOOKBACK ? latest - DEFAULT_LOOKBACK : 0n;
      const [buys, sells] = await Promise.all([
        client.getLogs({ address: curve, event: curveBuyEvent, fromBlock, toBlock: latest }),
        client.getLogs({ address: curve, event: curveSellEvent, fromBlock, toBlock: latest }),
      ]);
      const mapped = [
        ...buys.map((log) => ({
          side: "buy" as const,
          actor: log.args.buyer as Address,
          quote: log.args.quoteIn as bigint,
          tokens: log.args.tokensOut as bigint,
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
        ...sells.map((log) => ({
          side: "sell" as const,
          actor: log.args.seller as Address,
          quote: log.args.quoteOut as bigint,
          tokens: log.args.tokensIn as bigint,
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
      ].sort((a, b) => Number(b.blockNumber - a.blockNumber));
      return mapped.slice(0, 40);
    },
  });

  if (!curve) {
    return (
      <section className="surface rounded-[28px] p-5 text-sm text-[var(--muted)]">
        V1 trades happen on Uniswap V3. Open the pool on the explorer for the full swap history.
      </section>
    );
  }

  return (
    <section className="surface rounded-[28px] p-5">
      <h3 className="mb-3 font-[family-name:var(--font-display)] text-lg">Transaction history</h3>
      {query.isLoading ? <p className="text-sm text-[var(--muted)]">Loading trades…</p> : null}
      <div className="space-y-2">
        {query.data?.map((row) => (
          <a
            key={row.hash + row.side + row.blockNumber}
            href={explorerTx(row.hash)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-2xl bg-[color-mix(in_srgb,var(--bg1)_70%,transparent)] px-3 py-2.5 text-sm hover:bg-[var(--panel)]"
          >
            <span className={row.side === "buy" ? "font-semibold text-[var(--buy)]" : "font-semibold text-[var(--sell)]"}>
              {row.side}
            </span>
            <span>{formatAmount(row.tokens, 18, 3)} tok</span>
            <span>
              {formatAmount(row.quote, decimals, 4)} {pairSymbol(pairToken)}
            </span>
            <span className="text-[var(--muted)]">{shorten(row.actor)}</span>
          </a>
        ))}
        {query.data?.length === 0 ? <p className="text-sm text-[var(--muted)]">No recent curve trades in this window.</p> : null}
      </div>
    </section>
  );
}
