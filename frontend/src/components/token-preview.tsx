"use client";

import { pairInfo } from "@/lib/contracts/addresses";
import type { Address } from "viem";
import { formatBps } from "@/lib/format";
import { TokenLogo } from "./token-logo";
import { PLATFORM_FEE_ETH } from "@/lib/brand";

export function TokenPreview({
  name,
  symbol,
  description,
  image,
  pairToken,
  creatorTaxBps,
  buybackEnabled,
  supplyLabel,
  animated,
  curveFeeBps,
  graduationLabel,
}: {
  name: string;
  symbol: string;
  description: string;
  image: string;
  pairToken: Address;
  creatorTaxBps: number;
  buybackEnabled: boolean;
  supplyLabel: string;
  animated?: boolean;
  curveFeeBps: number;
  graduationLabel: string;
}) {
  const pair = pairInfo(pairToken);
  return (
    <aside className="rounded-[28px] bg-white p-5 shadow-sm dark:bg-[var(--panel)]">
      {image ? (
        <TokenLogo src={image} alt={name || "Token preview"} size="lg" />
      ) : (
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#f3f3f3] text-[var(--muted)]">▣</div>
      )}
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl tracking-tight">{name || "Your token"}</h3>
      <p className="text-[var(--muted)]">
        ${symbol || "ticker"} {animated ? "· GIF" : ""}
      </p>
      <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">{description}</p>
      <dl className="mt-5 space-y-2 text-sm">
        <Row label="Launch fee" value={`${PLATFORM_FEE_ETH} ETH`} />
        <Row label="Paired with" value={pair.symbol} />
        <Row label="Trade fee" value={formatBps(curveFeeBps + creatorTaxBps)} />
        <Row label="Graduation" value={graduationLabel} />
        <Row label="Supply" value={supplyLabel} />
        <Row label="Liquidity" value="Locked" />
        {buybackEnabled ? <Row label="Buybacks" value="5-year vest" /> : null}
      </dl>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2 last:border-b-0">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
