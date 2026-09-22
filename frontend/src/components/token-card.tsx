"use client";

import Link from "next/link";
import type { LaunchRecord } from "@/lib/types";
import { pairSymbol } from "@/lib/contracts/addresses";
import { shorten } from "@/lib/format";
import { TokenLogo } from "./token-logo";

export function TokenCard({
  launch,
  name,
  symbol,
  logo,
  image,
  progress,
  phaseLabel,
  pinned,
  href,
}: {
  launch?: LaunchRecord;
  name?: string;
  symbol?: string;
  logo?: string;
  image?: string;
  progress?: number;
  phaseLabel?: string;
  pinned?: boolean;
  href?: string;
}) {
  const title = name || (launch ? shorten(launch.token) : "Fons");
  const ticker = symbol || "TOKEN";
  const to = href || (launch ? `/token/${launch.token}` : "/create");
  const pct = Math.round((progress ?? 0) * 100);

  return (
    <Link href={to} className="token-tile group">
      <article>
        <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#ececec] dark:bg-white/5">
          <TokenLogo src={image} uri={logo} alt={name || symbol || "Token"} size="xl" className="h-full w-full rounded-[22px]" />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {pinned ? (
              <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">Pinned</span>
            ) : null}
            {phaseLabel ? (
              <span className="rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-medium text-black shadow-sm">
                {phaseLabel}
              </span>
            ) : null}
            {launch?.generation ? (
              <span className="rounded-full bg-[var(--lime)] px-2 py-0.5 text-[10px] font-semibold uppercase text-black">
                {launch.generation}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2.5 min-w-0 px-0.5">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          <p className="truncate text-xs text-[var(--muted)]">${ticker}</p>
          <div className="mt-2">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              {launch ? `${pairSymbol(launch.pairToken)} · ${pct}%` : "Platform token"}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
