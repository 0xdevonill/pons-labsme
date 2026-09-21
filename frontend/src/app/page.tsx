"use client";

import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";

export default function HomePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];

  return (
    <div>
      {launches.isLoading ? (
        <div className="launchpad-panel shimmer h-96 rounded-[32px]" />
      ) : launches.isError ? (
        <div className="rounded-[32px] bg-white p-8 text-sm text-[var(--muted)]">
          Could not load launches. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} showPinned />
      )}
    </div>
  );
}
