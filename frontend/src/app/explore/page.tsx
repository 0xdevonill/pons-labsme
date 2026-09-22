"use client";

import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";

export default function ExplorePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];

  return (
    <div>
      <p className="section-kicker">Market</p>
      <h1 className="mt-2 mb-6 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-5xl">
        Explore tokens
      </h1>
      {launches.isLoading ? (
        <div className="launchpad-panel shimmer h-64 rounded-[32px]" />
      ) : launches.isError ? (
        <div className="surface rounded-[32px] p-8 text-sm text-[var(--muted)]">
          Could not load launches. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} showPinned />
      )}
    </div>
  );
}
