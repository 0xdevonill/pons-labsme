"use client";

import Link from "next/link";
import { FONS_TOKEN_ADDRESS, PINNED_TOKEN } from "@/lib/brand";
import { TokenCard } from "./token-card";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import type { Address } from "viem";

export function PinnedFonsCard() {
  const address = FONS_TOKEN_ADDRESS ? (FONS_TOKEN_ADDRESS as Address) : undefined;
  const detail = useTokenDetail(address);

  if (address && detail.data) {
    return (
      <TokenCard
        launch={detail.data.launch as never}
        name={detail.data.meta.name || PINNED_TOKEN.name}
        symbol={detail.data.meta.symbol || PINNED_TOKEN.symbol}
        logo={detail.data.meta.logo}
        image={detail.data.imageSrc || PINNED_TOKEN.logo}
        progress={detail.data.progress}
        phaseLabel={detail.data.graduated ? "Graduated" : "Pinned"}
        pinned
        href={`/token/${address}`}
      />
    );
  }

  const card = (
    <article>
      <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#ececec]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PINNED_TOKEN.logo} alt={PINNED_TOKEN.name} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white">
          Pinned
        </span>
      </div>
      <div className="mt-2.5">
        <h3 className="text-sm font-semibold">{PINNED_TOKEN.name}</h3>
        <p className="text-xs text-[var(--muted)]">${PINNED_TOKEN.symbol}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {address ? "Loading contract…" : "Coming soon · add contract address to activate"}
        </p>
      </div>
    </article>
  );

  if (!address) return card;

  return (
    <Link href={`/token/${address}`} className="group block">
      {card}
    </Link>
  );
}
