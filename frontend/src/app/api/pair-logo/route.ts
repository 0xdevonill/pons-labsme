import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { robinhoodLogoUrl } from "@/lib/pair-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_RH_HASH = 4058;

async function fetchImage(url: string) {
  const upstream = await fetch(url, {
    headers: { Accept: "image/png,image/svg+xml,image/*", "User-Agent": "Fons/1.0" },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) return null;
  const type = upstream.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return null;
  const bytes = Buffer.from(await upstream.arrayBuffer());
  if (bytes.length < 80) return null;
  return { bytes, type };
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").toUpperCase();
  const remote = req.nextUrl.searchParams.get("url") ?? "";

  const candidates: string[] = [];
  if (symbol && !symbol.startsWith("0X")) {
    candidates.push(`https://storage.googleapis.com/iex/api/logos/${encodeURIComponent(symbol)}.png`);
    candidates.push(`https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`);
    candidates.push(`https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}`);
  }
  if (isAddress(address)) candidates.push(robinhoodLogoUrl(address));
  if (remote.startsWith("https://cdn.robinhood.com/ncw_assets/logos/")) candidates.push(remote);

  for (const url of candidates) {
    try {
      const image = await fetchImage(url);
      if (!image) continue;
      if (url.includes("cdn.robinhood.com") && image.bytes.length === GENERIC_RH_HASH) continue;
      return new NextResponse(image.bytes, {
        headers: {
          "Content-Type": image.type,
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "Logo not found" }, { status: 404 });
}
