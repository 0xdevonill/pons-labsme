"use client";

import { ipfsToHttp } from "@/lib/ipfs";
import { pairSymbol } from "@/lib/contracts/addresses";
import type { Address } from "viem";
import { formatBps } from "@/lib/format";

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
}) {
  const src = image.startsWith("ipfs://") ? ipfsToHttp(image) : image;
  return (
    <aside className="glass overflow-hidden rounded-[28px]">
      <div className="aspect-square bg-white/5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-5xl opacity-30">P</div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Preview</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl">{name || "Untitled"}</h3>
        <p className="text-[var(--muted)]">${symbol || "TICKER"}</p>
        <p className="mt-3 line-clamp-4 text-sm text-[var(--muted)]">{description || "Your story shows up here before you launch."}</p>
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
            <dt className="text-[var(--muted)]">Creator tax</dt>
            <dd>{formatBps(creatorTaxBps)}</dd>
          </div>
        </dl>
        {buybackEnabled ? <p className="mt-3 text-xs text-[#7dffc3]">Buybacks vest for 5 years</p> : null}
      </div>
    </aside>
  );
}
