"use client";

import type { Address } from "viem";
import { useQuery } from "@tanstack/react-query";
import { pairInfo } from "@/lib/contracts/addresses";
import { looksLikeAddress, pairDisplayName, pairLogoSrc, type PairAssetMeta } from "@/lib/pair-assets";

export function usePairAssets() {
  return useQuery({
    queryKey: ["pair-assets"],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const response = await fetch("/api/pair-assets");
      if (!response.ok) throw new Error("Could not load pair logos");
      const body = (await response.json()) as { assets: PairAssetMeta[] };
      const byAddress = new Map<string, PairAssetMeta>();
      const bySymbol = new Map<string, PairAssetMeta>();
      for (const asset of body.assets ?? []) {
        const mapped = { ...asset, logoUrl: pairLogoSrc(asset.address, asset.logoUrl, asset.symbol) };
        if (asset.address) byAddress.set(asset.address.toLowerCase(), mapped);
        if (asset.symbol) bySymbol.set(asset.symbol.toUpperCase(), mapped);
      }
      const assets = [...byAddress.values()];
      return { assets, byAddress, bySymbol };
    },
  });
}

export function usePairMeta(address?: Address) {
  const catalog = usePairAssets();
  const known = pairInfo(address);
  const meta =
    (address ? catalog.data?.byAddress.get(address.toLowerCase()) : undefined) ??
    (!looksLikeAddress(known.symbol) ? catalog.data?.bySymbol.get(known.symbol.toUpperCase()) : undefined);
  const kind = known.kind === "unknown" && meta ? "stock" : known.kind;
  const symbol = looksLikeAddress(known.symbol) ? meta?.symbol || known.symbol : known.symbol;
  const name = pairDisplayName({
    name: meta?.name || known.name,
    symbol,
    address: known.address,
    kind,
  });
  const logoUrl =
    kind === "stock" ? meta?.logoUrl || pairLogoSrc(known.address, undefined, symbol) : undefined;
  return {
    ...known,
    symbol,
    name,
    kind,
    logoUrl,
    showAddress: kind === "unknown" || looksLikeAddress(symbol),
  };
}
