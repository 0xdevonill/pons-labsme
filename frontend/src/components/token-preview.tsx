"use client";

import { pairSymbol } from "@/lib/contracts/addresses";
import type { Address } from "viem";
import { formatBps } from "@/lib/format";
import { TokenLogo } from "./token-logo";

export function TokenPreview({
  name,
  symbol,
  description,
  image,
  pairToken,
  generation,
  creatorTaxBps,
  buybackEnabled,
  supplyLabel,
  animated,
}: {
  name: string;
  symbol: string;
  description: string;
  image: string;
  pairToken: Address;
  generation: "v1" | "v2";
  creatorTaxBps: number;
  buybackEnabled: boolean;
  supplyLabel: string;
  animated?: boolean;
}) {
  return (
    <aside className="glass overflow-hidden rounded-[28px]">
      <TokenLogo src={image} alt={name || "Token preview"} size="xl" className="rounded-none" />
      <div className="p-5">
        <p className="section-kicker">Preview</p>
        <div className="mt-2 flex items-center gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{name || "Untitled"}</h3>
          {animated ? <span className="chip chip-active">GIF</span> : null}
        </div>
        <p className="text-[var(--muted)]">${symbol || "TICKER"}</p>
        <p className="mt-3 line-clamp-4 text-sm text-[var(--muted)]">
          {description || "Your story shows up here before you launch."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[var(--muted)]">Generation</dt>
            <dd>{generation.toUpperCase()}</dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[var(--muted)]">Quote</dt>
            <dd>{pairSymbol(pairToken)}</dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[var(--muted)]">Supply</dt>
            <dd>{supplyLabel}</dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[var(--muted)]">Creator commission</dt>
            <dd>{formatBps(creatorTaxBps)}</dd>
          </div>
        </dl>
        {buybackEnabled ? <p className="mt-3 text-xs text-[#5eead4]">Buybacks vest for 5 years</p> : null}
      </div>
    </aside>
  );
}
