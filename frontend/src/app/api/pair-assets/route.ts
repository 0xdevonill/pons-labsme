import { NextResponse } from "next/server";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { KNOWN_PAIR_TOKENS, ZERO_ADDRESS } from "@/lib/contracts/addresses";
import { cleanPairName, robinhoodLogoUrl, type PairAssetMeta } from "@/lib/pair-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RhjAsset = {
  tokenSymbol?: string;
  tokenName?: string;
  logoUrl?: string;
  deployments?: Array<{ contractAddress?: string; chainId?: number }>;
};

type Cached = { expires: number; payload: { assets: PairAssetMeta[] } };
let cache: Cached | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  }

  const byAddress = new Map<string, PairAssetMeta>();

  try {
    const response = await fetch("https://api.robinhood.com/rhj/assets", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const body = (await response.json()) as { assets?: RhjAsset[] };
      for (const asset of body.assets ?? []) {
        const deployment = (asset.deployments ?? []).find((item) => item.chainId === ROBINHOOD_CHAIN_ID) ?? asset.deployments?.[0];
        const address = deployment?.contractAddress;
        if (!address || !asset.tokenSymbol) continue;
        byAddress.set(address.toLowerCase(), {
          symbol: asset.tokenSymbol,
          name: cleanPairName(asset.tokenName ?? "", asset.tokenSymbol),
          logoUrl: asset.logoUrl || robinhoodLogoUrl(address),
          address,
        });
      }
    }
  } catch {
    // Fall through to known-token logos derived from contract addresses.
  }

  for (const token of KNOWN_PAIR_TOKENS) {
    if (token.kind !== "stock" || token.address === ZERO_ADDRESS) continue;
    const key = token.address.toLowerCase();
    if (!byAddress.has(key)) {
      byAddress.set(key, {
        symbol: token.symbol,
        name: token.name,
        logoUrl: robinhoodLogoUrl(token.address),
        address: token.address,
      });
    }
  }

  const payload = { assets: [...byAddress.values()] };
  cache = { expires: Date.now() + TTL_MS, payload };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
