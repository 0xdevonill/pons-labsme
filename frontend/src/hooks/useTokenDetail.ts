"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { parseBigints } from "@/lib/rpc";
import type { TokenDetail } from "@/lib/token-detail";
import { emptySocials, type TokenMeta } from "@/lib/types";

export function useTokenDetail(address?: Address) {
  return useQuery({
    queryKey: ["token", address],
    enabled: Boolean(address),
    staleTime: 10_000,
    retry: 2,
    queryFn: async () => {
      const res = await fetch(`/api/token/${address}`);
      const text = await res.text();
      if (!res.ok) {
        const body = (() => {
          try {
            return JSON.parse(text) as { error?: string };
          } catch {
            return { error: res.statusText };
          }
        })();
        throw new Error(body.error || "Token not found on the live launch factories.");
      }
      return parseBigints<TokenDetail>(text);
    },
  });
}

export function emptyMeta(): TokenMeta {
  return { name: "", symbol: "", logo: "", description: "", socials: emptySocials };
}
