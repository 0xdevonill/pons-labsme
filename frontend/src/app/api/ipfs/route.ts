import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_MEDIA, MAX_MEDIA_BYTES } from "@/lib/ipfs";

export const runtime = "nodejs";

async function pinFile(filename: string, bytes: Blob | Buffer, jwt: string, mime: string) {
  const body = new FormData();
  const blob = bytes instanceof Blob ? bytes : new Blob([new Uint8Array(bytes)], { type: mime });
  body.append("file", blob, filename);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Pinata upload failed");
  }
  const json = (await res.json()) as { IpfsHash: string };
  return json.IpfsHash;
}

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured. Set it to enable IPFS uploads." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const metadataRaw = form.get("metadata");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
  }
  if (!Object.keys(ACCEPTED_MEDIA).includes(file.type) && !/\.(png|jpe?g|gif|webp)$/i.test(file.name)) {
    return NextResponse.json({ error: "Only PNG, GIF, animated WebP and JPG are allowed" }, { status: 400 });
  }

  try {
    const imageCid = await pinFile(file.name || "image", file, jwt, file.type || "application/octet-stream");
    const imageUri = `ipfs://${imageCid}`;
    const parsed = metadataRaw ? JSON.parse(String(metadataRaw)) : {};
    const metadata = {
      ...parsed,
      image: imageUri,
    };
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
    const metadataCid = await pinFile("metadata.json", metadataBlob, jwt, "application/json");
    const metadataUri = `ipfs://${metadataCid}`;
    return NextResponse.json({ imageUri, metadataUri, imageCid, metadataCid });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "IPFS upload failed" },
      { status: 500 },
    );
  }
}
