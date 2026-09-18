"use client";

import { useMemo, useState } from "react";
import type { LaunchRecord } from "@/lib/types";
import { TokenCard } from "./token-card";
import { isAddressLike } from "@/lib/format";
import { pairSymbol } from "@/lib/contracts/addresses";

export function SearchFilters({
  launches,
  extras,
}: {
  launches: LaunchRecord[];
  extras?: Record<string, { name?: string; symbol?: string; logo?: string; progress?: number; phaseLabel?: string }>;
}) {
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState<"all" | "v1" | "v2">("all");
  const [pair, setPair] = useState("all");

  const pairs = useMemo(() => {
    const set = new Set(launches.map((l) => pairSymbol(l.pairToken)));
    return ["all", ...[...set].sort()];
  }, [launches]);

  const filtered = launches.filter((launch) => {
    if (generation !== "all" && launch.generation !== generation) return false;
    if (pair !== "all" && pairSymbol(launch.pairToken) !== pair) return false;
    if (!q.trim()) return true;
    const extra = extras?.[launch.token.toLowerCase()];
    const hay = `${launch.token} ${launch.deployer} ${extra?.name ?? ""} ${extra?.symbol ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase()) || (isAddressLike(q.trim()) && launch.token.toLowerCase() === q.trim().toLowerCase());
  });

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
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-[var(--muted)]">No tokens match those filters.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((launch) => {
            const extra = extras?.[launch.token.toLowerCase()];
            return (
              <TokenCard
                key={launch.token}
                launch={launch}
                name={extra?.name}
                symbol={extra?.symbol}
                logo={extra?.logo}
                progress={extra?.progress}
                phaseLabel={extra?.phaseLabel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
