"use client";

import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";

export default function ExplorePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];

  return (
    <div>
      <p className="section-kicker">Market</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">Explore tokens</h1>
      <p className="mt-2 mb-6 max-w-2xl text-[var(--muted)]">
        Indexed from TokenLaunched on the live V1 and V2 factories. Search by ticker, creator, or contract.
      </p>
      {launches.isLoading ? (
        <div className="glass shimmer h-64 rounded-3xl" />
      ) : launches.isError ? (
        <div className="glass rounded-3xl p-8 text-sm text-[var(--muted)]">
          Could not index factories. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} />
      )}
    </div>
  );
}
