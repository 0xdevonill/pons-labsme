"use client";

import { formatAmount } from "@/lib/format";
import { pairSymbol } from "@/lib/contracts/addresses";
import type { Address } from "viem";
import { cn } from "@/lib/cn";

export function BondingCurveProgress({
  progress,
  raised,
  threshold,
  pairToken,
  decimals,
  phaseLabel,
}: {
  progress: number;
  raised: bigint;
  threshold: bigint;
  pairToken: Address;
  decimals: number;
  phaseLabel: string;
}) {
  const pct = Math.min(100, Math.round(progress * 1000) / 10);
  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg">Bonding curve</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{phaseLabel}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r from-[#7dffc3] via-[#b7f0d6] to-[#e4c56a] transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm text-[var(--muted)]">
        <span>
          {formatAmount(raised, decimals, 4)} / {formatAmount(threshold, decimals, 4)} {pairSymbol(pairToken)}
        </span>
        <span>{pct}%</span>
      </div>
    </section>
  );
}
