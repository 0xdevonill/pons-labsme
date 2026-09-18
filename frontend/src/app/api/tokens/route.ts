import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { robinhood, RPC_URL } from "@/lib/chain";
import { DEFAULT_LOOKBACK, fetchLaunchLogs } from "@/lib/indexer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const generation = (req.nextUrl.searchParams.get("generation") ?? "all") as "v1" | "v2" | "all";
  const deployerParam = req.nextUrl.searchParams.get("deployer");
  const deployer = deployerParam && isAddress(deployerParam) ? (deployerParam as Address) : undefined;
  const lookback = BigInt(req.nextUrl.searchParams.get("lookback") ?? DEFAULT_LOOKBACK.toString());

  const client = createPublicClient({
    chain: robinhood,
    transport: http(RPC_URL),
  });

  const latest = await client.getBlockNumber();
  const fromBlock = latest > lookback ? latest - lookback : 0n;
  const launches = await fetchLaunchLogs(client, {
    generation,
    deployer,
    fromBlock,
    toBlock: latest,
  });

  return NextResponse.json({
    fromBlock: fromBlock.toString(),
    toBlock: latest.toString(),
    launches: launches.map((item) => ({
      ...item,
      launchConfigId: item.launchConfigId.toString(),
      graduationThreshold: item.graduationThreshold?.toString(),
      blockNumber: item.blockNumber.toString(),
    })),
  });
}
