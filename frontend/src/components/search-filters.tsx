"use client";

import { useEffect, useMemo, useState } from "react";
import type { LaunchRecord } from "@/lib/types";
import { TokenCard } from "./token-card";
import { isAddressLike } from "@/lib/format";
import { pairSymbol } from "@/lib/contracts/addresses";
import { useLaunchMeta } from "@/hooks/useLaunchMeta";

const PAGE_SIZE = 24;

export function SearchFilters({ launches }: { launches: LaunchRecord[] }) {
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState<"all" | "v1" | "v2">("all");
  const [pair, setPair] = useState("all");
  const [page, setPage] = useState(0);

  const pairs = useMemo(() => {
    const set = new Set(launches.map((l) => pairSymbol(l.pairToken)));
    return ["all", ...[...set].sort()];
  }, [launches]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return launches.filter((launch) => {
      if (generation !== "all" && launch.generation !== generation) return false;
      if (pair !== "all" && pairSymbol(launch.pairToken) !== pair) return false;
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

  return (
    <div>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, symbol, or address"
          className="glass h-12 rounded-2xl px-4 text-sm outline-none"
        />
        <select
          value={generation}
          onChange={(e) => setGeneration(e.target.value as "all" | "v1" | "v2")}
          className="glass h-12 rounded-2xl px-3 text-sm"
        >
          <option value="all">All generations</option>
          <option value="v2">V2 curve</option>
          <option value="v1">V1 Uniswap</option>
        </select>
        <select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className="glass h-12 rounded-2xl px-3 text-sm"
        >
          {pairs.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All quote assets" : item}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {filtered.length.toLocaleString()} launch{filtered.length === 1 ? "" : "es"}
        {filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : ""}
      </p>
      {named.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-[var(--muted)]">No tokens match those filters.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="glass rounded-full px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="glass rounded-full px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
