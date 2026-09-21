"use client";

import { useAccount } from "wagmi";
import { useLaunches } from "@/hooks/useLaunches";
import { explorerTx, pairSymbol } from "@/lib/contracts/addresses";
import { shorten } from "@/lib/format";
import Link from "next/link";

export default function ActivityPage() {
  const { address } = useAccount();
  const query = useLaunches({ deployer: address, enabled: true });
  const rows = query.data?.launches ?? [];

  return (
    <div>
      <p className="section-kicker">History</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">Transaction history</h1>
      <p className="mt-2 mb-6 text-[var(--muted)]">
        Recent factory launches{address ? " for the connected wallet" : ""}. Open a token for curve buys and sells.
      </p>
      {query.isLoading ? <div className="glass shimmer h-40 rounded-3xl" /> : null}
      {query.isError ? (
        <p className="text-[var(--muted)]">{query.error.message}</p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 80).map((row) => (
            <div key={row.txHash} className="glass flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm">
              <Link href={`/token/${row.token}`} className="min-w-0 truncate font-medium">
                {row.generation.toUpperCase()} {shorten(row.token)}
              </Link>
              <span className="shrink-0 text-[var(--muted)]">{pairSymbol(row.pairToken)}</span>
              <a href={explorerTx(row.txHash)} target="_blank" rel="noreferrer" className="shrink-0 text-[var(--muted)]">
                {shorten(row.txHash, 6)}
              </a>
            </div>
          ))}
          {!query.isLoading && rows.length === 0 ? <p className="text-[var(--muted)]">No launches in this window.</p> : null}
        </div>
      )}
    </div>
  );
}
