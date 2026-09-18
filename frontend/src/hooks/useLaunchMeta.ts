"use client";

import { useQuery } from "@tanstack/react-query";
import type { LaunchRecord } from "@/lib/types";
import { serializeLaunch } from "@/lib/indexer";
import type { LaunchExtra } from "@/lib/launch-meta";

export type { LaunchExtra };

export function useLaunchMeta(launches: LaunchRecord[], limit = 48) {
  const slice = launches.slice(0, limit);

  return useQuery({
    queryKey: ["launch-meta", slice.map((l) => l.token.toLowerCase()).join(",")],
    enabled: Boolean(slice.length),
    staleTime: 30_000,
    retry: 2,
    queryFn: async () => {
      const res = await fetch("/api/meta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ launches: slice.map(serializeLaunch) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || "Failed to load token metadata");
      }
      return (await res.json()) as Record<string, LaunchExtra>;
    },
  });
}
