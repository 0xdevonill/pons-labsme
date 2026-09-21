"use client";

import Link from "next/link";
import type { LaunchRecord } from "@/lib/types";
import { pairSymbol } from "@/lib/contracts/addresses";
import { shorten } from "@/lib/format";
import { cn } from "@/lib/cn";
import { TokenLogo } from "./token-logo";

export function TokenCard({
  launch,
  name,
  symbol,
  logo,
  image,
  progress,
  phaseLabel,
}: {
  launch: LaunchRecord;
  name?: string;
  symbol?: string;
  logo?: string;
  image?: string;
  progress?: number;
  phaseLabel?: string;
}) {
  const title = name || shorten(launch.token);

  return (
    <Link href={`/token/${launch.token}`} className="group block">
      <article className="glass relative overflow-hidden rounded-[24px] p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20">
        <div className="flex items-start gap-3">
          <TokenLogo src={image} uri={logo} alt={title} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
                {title}
              </h3>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {launch.generation}
              </span>
            </div>
            <p className="truncate text-sm text-[var(--muted)]">
              ${symbol || "TOKEN"} · {pairSymbol(launch.pairToken)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>{phaseLabel || (launch.generation === "v2" ? "Bonding curve" : "Uniswap V3")}</span>
            <span>{Math.round((progress ?? 0) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r from-[#5eead4] to-[#d4af67]")}
              style={{ width: `${Math.min(100, Math.round((progress ?? 0) * 100))}%` }}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
