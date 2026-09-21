"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LaunchRecord } from "@/lib/types";
import { TokenCard } from "./token-card";
import { PinnedFonsCard } from "./pinned-fons-card";
import { isAddressLike } from "@/lib/format";
import { pairInfo, pairSymbol } from "@/lib/contracts/addresses";
import { useLaunchMeta } from "@/hooks/useLaunchMeta";
import { FONS_TOKEN_ADDRESS } from "@/lib/brand";

const PAGE_SIZE = 24;

export function SearchFilters({
  launches,
  showPinned = true,
}: {
  launches: LaunchRecord[];
  showPinned?: boolean;
}) {
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState<"all" | "v1" | "v2">("all");
  const [pair, setPair] = useState("all");
  const [page, setPage] = useState(0);

  const pairs = useMemo(() => {
    const set = new Set(launches.map((l) => pairSymbol(l.pairToken)));
    return ["all", "stocks", ...[...set].sort()];
  }, [launches]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const fons = FONS_TOKEN_ADDRESS.toLowerCase();
    return launches.filter((launch) => {
      if (fons && launch.token.toLowerCase() === fons) return false;
      if (generation !== "all" && launch.generation !== generation) return false;
      if (pair === "stocks") {
        if (pairInfo(launch.pairToken).kind !== "stock") return false;
      } else if (pair !== "all" && pairSymbol(launch.pairToken) !== pair) {
        return false;
      }
      if (!query) return true;
      if (isAddressLike(query) && launch.token.toLowerCase() === query) return true;
      const hay = `${launch.token} ${launch.deployer}`.toLowerCase();
      return hay.includes(query);
    });
  }, [launches, generation, pair, q]);

  useEffect(() => {
    setPage(0);
  }, [q, generation, pair]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const meta = useLaunchMeta(pageItems, PAGE_SIZE);

  const named = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query || isAddressLike(query)) return pageItems;
    return pageItems.filter((launch) => {
      const extra = meta.data?.[launch.token.toLowerCase()];
      const hay = `${extra?.name ?? ""} ${extra?.symbol ?? ""}`.toLowerCase();
      return hay.includes(query) || launch.token.toLowerCase().includes(query);
    });
  }, [pageItems, meta.data, q]);

  const pinOnThisPage = showPinned && safePage === 0 && !q && pair === "all" && generation !== "v1";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tokens"
          className="h-12 min-w-[220px] flex-1 rounded-full bg-white px-5 text-sm shadow-sm outline-none dark:bg-[var(--panel)]"
        />
        <select
          value={generation}
          onChange={(e) => setGeneration(e.target.value as "all" | "v1" | "v2")}
          className="h-12 rounded-full bg-white px-4 text-sm shadow-sm dark:bg-[var(--panel)]"
        >
          <option value="all">All</option>
          <option value="v2">V2</option>
          <option value="v1">V1</option>
        </select>
        <select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className="h-12 rounded-full bg-white px-4 text-sm shadow-sm dark:bg-[var(--panel)]"
        >
          {pairs.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All pairs" : item === "stocks" ? "Stocks" : item}
            </option>
          ))}
        </select>
        <Link href="/create" className="btn-primary h-12 px-5">
          + Create
        </Link>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {filtered.length.toLocaleString()} launched
        {filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : ""}
      </p>
      <div className="launchpad-panel rounded-[32px] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight">Explore</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Tokens still climbing toward graduation on Robinhood Chain.</p>
        </div>
        {named.length === 0 && !pinOnThisPage ? (
          <div className="rounded-3xl bg-white/70 p-10 text-center text-[var(--muted)]">No tokens match those filters.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {pinOnThisPage ? <PinnedFonsCard /> : null}
            {named.map((launch) => {
              const extra = meta.data?.[launch.token.toLowerCase()];
              return (
                <TokenCard
                  key={launch.token}
                  launch={launch}
                  name={extra?.name}
                  symbol={extra?.symbol}
                  logo={extra?.logo}
                  image={extra?.image}
                  progress={extra?.progress}
                  phaseLabel={extra?.phaseLabel}
                />
              );
            })}
          </div>
        )}
        {pageCount > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm text-[var(--muted)]">{safePage + 1}</span>
            <button
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
