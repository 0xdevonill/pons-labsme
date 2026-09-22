"use client";

import { formatAmount } from "@/lib/format";
import { pairSymbol } from "@/lib/contracts/addresses";
import type { Address } from "viem";

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
    <section className="surface rounded-[28px] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg">Bonding curve</h3>
        <span className="chip">{phaseLabel}</span>
      </div>
      <div className="progress-track h-3">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-sm text-[var(--muted)]">
        <span>
          {formatAmount(raised, decimals, 4)} / {formatAmount(threshold, decimals, 4)} {pairSymbol(pairToken)}
        </span>
        <span className="font-medium text-[var(--ink)]">{pct}%</span>
      </div>
    </section>
  );
}
