import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { loadTokenDetail } from "@/lib/token-detail";
import { stringifyBigints } from "@/lib/rpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }
  try {
    const detail = await loadTokenDetail(address as Address);
    return new NextResponse(stringifyBigints(detail), {
      headers: {
        "content-type": "application/json",
        "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load token";
    const status = message.includes("not a live launch") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
