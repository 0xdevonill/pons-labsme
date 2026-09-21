import { NextRequest, NextResponse } from "next/server";
import { isAllowedRemoteMediaUrl, ipfsToHttp, resolveLogoSrc, sniffBytes } from "@/lib/ipfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "Missing media URI" }, { status: 400 });
  }

  let uri = raw;
  try {
    uri = decodeURIComponent(raw);
  } catch {
    uri = raw;
  }

  try {
    const resolved = await resolveLogoSrc(uri);
    const target = resolved || ipfsToHttp(uri);
    if (!target || !isAllowedRemoteMediaUrl(target)) {
      return NextResponse.json({ error: "Media host is not allowed" }, { status: 400 });
    }

    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "image/*,application/json,*/*" },
      redirect: "follow",
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Could not load media" }, { status: 502 });
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    const sniffed = sniffBytes(bytes);
    const contentType =
      sniffed ||
      (upstream.headers.get("content-type")?.startsWith("image/")
        ? upstream.headers.get("content-type")!
        : "application/octet-stream");

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": contentType,
        "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load media" },
      { status: 502 },
    );
  }
}
