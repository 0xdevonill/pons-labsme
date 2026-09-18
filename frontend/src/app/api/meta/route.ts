import { NextRequest, NextResponse } from "next/server";
import { parseLaunchRecord, type SerializedLaunch } from "@/lib/indexer";
import { loadLaunchMeta } from "@/lib/launch-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { launches?: SerializedLaunch[] };
    const launches = (body.launches ?? []).slice(0, 48).map(parseLaunchRecord);
    const extras = await loadLaunchMeta(launches);
    return NextResponse.json(extras, {
      headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load token metadata" },
      { status: 502 },
    );
  }
}
