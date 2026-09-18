"use client";

import { useLaunches } from "@/hooks/useLaunches";
import { useLaunchMeta } from "@/hooks/useLaunchMeta";
import { SearchFilters } from "@/components/search-filters";

export default function ExplorePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];
  const meta = useLaunchMeta(list, 60);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">Explore tokens</h1>
      <p className="mt-2 mb-6 max-w-2xl text-[var(--muted)]">
        Indexed from `TokenLaunched` on the live V1 and V2 factories. Search by name, ticker, creator, or contract.
      </p>
      {launches.isLoading ? <div className="glass shimmer h-64 rounded-3xl" /> : <SearchFilters launches={list} extras={meta.data} />}
    </div>
  );
}
