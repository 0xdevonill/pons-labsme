const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

export const ACCEPTED_MEDIA = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

export const ACCEPTED_MEDIA_LABEL = "PNG, GIF, animated WebP, JPG";
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

const MAGIC: Array<{ mime: string; test: (bytes: Uint8Array) => boolean }> = [
  { mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    mime: "image/webp",
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

export function isAllowedMediaFile(file: File) {
  return Object.keys(ACCEPTED_MEDIA).includes(file.type) || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
}

export async function sniffMediaType(file: File) {
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const hit = MAGIC.find((row) => row.test(buf));
  return hit?.mime ?? null;
}

export function ipfsToHttp(uri: string, gatewayIndex = 0) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const path = uri.slice("ipfs://".length).replace(/^ipfs\//, "");
    return `${GATEWAYS[gatewayIndex % GATEWAYS.length]}${path}`;
  }
  if (uri.startsWith("ar://")) return `https://arweave.net/${uri.slice(5)}`;
  return uri;
}

export type TokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: Record<string, string>;
};

export function buildMetadata(input: {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  farcaster?: string;
}): TokenMetadata {
  return {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: input.imageUri,
    external_url: input.website || undefined,
    properties: {
      twitter: input.twitter || "",
      telegram: input.telegram || "",
      discord: input.discord || "",
      website: input.website || "",
      farcaster: input.farcaster || "",
    },
  };
}

export async function resolveLogoSrc(uri?: string | null): Promise<string> {
  if (!uri) return "";
  const url = ipfsToHttp(uri);
  if (!url) return "";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("json") || url.endsWith("metadata.json") || url.endsWith(".json")) {
      const meta = (await res.json()) as { image?: string; logo?: string };
      return ipfsToHttp(meta.image || meta.logo || url);
    }
    return url;
  } catch {
    return url;
  }
}

export async function uploadLaunchMedia(params: {
  file: File;
  metadata: Omit<TokenMetadata, "image"> & { image?: string };
}) {
  const body = new FormData();
  body.set("file", params.file);
  body.set("metadata", JSON.stringify(params.metadata));
  const res = await fetch("/api/ipfs", { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "IPFS upload failed");
  }
  return (await res.json()) as {
    imageUri: string;
    metadataUri: string;
    imageCid: string;
    metadataCid: string;
  };
}
