"use client";

import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";

export default function ExplorePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];

  return (
    <div>
      {launches.isLoading ? (
        <div className="launchpad-panel shimmer h-64 rounded-[32px]" />
      ) : launches.isError ? (
        <div className="rounded-[32px] bg-white p-8 text-sm text-[var(--muted)]">
          Could not index factories. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} showPinned />
      )}
    </div>
  );
}
