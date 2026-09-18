import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { robinhood, RPC_URL } from "@/lib/chain";
import { DEFAULT_LOOKBACK, fetchLaunchLogs, serializeLaunch, type SerializedLaunch } from "@/lib/indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedPayload = {
  fromBlock: string;
  toBlock: string;
  launches: SerializedLaunch[];
};

const cache = new Map<string, { expires: number; payload: CachedPayload }>();
const TTL_MS = 15_000;

function cacheKey(generation: string, deployer: string, lookback: string) {
  return `${generation}:${deployer}:${lookback}`;
}

export async function GET(req: NextRequest) {
  const generation = (req.nextUrl.searchParams.get("generation") ?? "all") as "v1" | "v2" | "all";
  const deployerParam = req.nextUrl.searchParams.get("deployer");
  const deployer = deployerParam && isAddress(deployerParam) ? (deployerParam as Address) : undefined;
  const lookbackRaw = req.nextUrl.searchParams.get("lookback") ?? DEFAULT_LOOKBACK.toString();
  let lookback: bigint;
  try {
    lookback = BigInt(lookbackRaw);
  } catch {
    return NextResponse.json({ error: "Invalid lookback" }, { status: 400 });
  }

  const key = cacheKey(generation, deployer ?? "any", lookback.toString());
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json(hit.payload, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  }

  try {
    const client = createPublicClient({
      chain: robinhood,
      transport: http(RPC_URL, { timeout: 25_000 }),
    });

    const latest = await client.getBlockNumber();
    const fromBlock = latest > lookback ? latest - lookback : 0n;
    const launches = await fetchLaunchLogs(client, {
      generation,
      deployer,
      fromBlock,
      toBlock: latest,
    });

    const payload: CachedPayload = {
      fromBlock: fromBlock.toString(),
      toBlock: latest.toString(),
      launches: launches.map(serializeLaunch),
    };
    cache.set(key, { expires: Date.now() + TTL_MS, payload });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to index TokenLaunched logs" },
      { status: 502 },
    );
  }
}
