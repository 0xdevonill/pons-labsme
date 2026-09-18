"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LaunchRecord } from "@/lib/types";
import { pairSymbol } from "@/lib/contracts/addresses";
import { ipfsToHttp, resolveLogoSrc } from "@/lib/ipfs";
import { shorten } from "@/lib/format";
import { cn } from "@/lib/cn";

export function TokenCard({
  launch,
  name,
  symbol,
  logo,
  progress,
  phaseLabel,
}: {
  launch: LaunchRecord;
  name?: string;
  symbol?: string;
  logo?: string;
  progress?: number;
  phaseLabel?: string;
}) {
  const [src, setSrc] = useState(logo ? ipfsToHttp(logo) : "");

  useEffect(() => {
    if (!logo) return;
    resolveLogoSrc(logo).then(setSrc).catch(() => setSrc(ipfsToHttp(logo)));
  }, [logo]);

  return (
    <Link href={`/token/${launch.token}`} className="group block">
      <article className="glass relative overflow-hidden rounded-3xl p-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/25">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/10">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-lg opacity-50">P</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-[family-name:var(--font-display)] text-base font-semibold">
                {name || shorten(launch.token)}
              </h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {launch.generation}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">${symbol || "TOKEN"} · {pairSymbol(launch.pairToken)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>{phaseLabel || (launch.generation === "v2" ? "Bonding curve" : "Uniswap V3")}</span>
            <span>{Math.round((progress ?? 0) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r from-[#7dffc3] to-[#e4c56a]")}
              style={{ width: `${Math.min(100, Math.round((progress ?? 0) * 100))}%` }}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
