const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://w3s.link/ipfs/",
  "https://dweb.link/ipfs/",
];

export const ACCEPTED_MEDIA = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

export const ACCEPTED_MEDIA_LABEL = "PNG, GIF, animated WebP, or JPG. Animation is preserved.";
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

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

export function sniffBytes(bytes: Uint8Array) {
  return MAGIC.find((row) => row.test(bytes))?.mime ?? null;
}

export async function sniffMediaType(file: File) {
  const buf = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  return sniffBytes(buf);
}

export function isAnimatedWebp(bytes: Uint8Array) {
  if (bytes.length < 21) return false;
  const chunk = String.fromCharCode(bytes[12] ?? 0, bytes[13] ?? 0, bytes[14] ?? 0, bytes[15] ?? 0);
  if (chunk !== "VP8X") return false;
  return (bytes[20] & 0b00000010) !== 0;
}

export function isAnimatedGif(bytes: Uint8Array) {
  if (sniffBytes(bytes) !== "image/gif") return false;
  const marker = "NETSCAPE2.0";
  const text = Array.from(bytes.slice(0, Math.min(bytes.length, 1024)), (n) => String.fromCharCode(n)).join("");
  if (text.includes(marker)) return true;
  let frames = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x2c) frames += 1;
    if (frames > 1) return true;
  }
  return frames > 1;
}

export function detectAnimationBytes(bytes: Uint8Array, mimeHint = "", fileName = "") {
  const mime = sniffBytes(bytes) ?? mimeHint;
  if (mime === "image/gif") return isAnimatedGif(bytes) || /\.gif$/i.test(fileName);
  if (mime === "image/webp") return isAnimatedWebp(bytes);
  return false;
}

export async function detectAnimation(file: File) {
  const head = new Uint8Array(await file.slice(0, Math.min(file.size, 256 * 1024)).arrayBuffer());
  return detectAnimationBytes(head, file.type, file.name);
}

export function extensionForMime(mime: string, fallbackName = "logo.png") {
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  const match = fallbackName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || "png";
}

export function ipfsToHttp(uri: string, gatewayIndex = 0) {
  if (!uri) return "";
  const trimmed = uri.trim();
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:") || trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("ipfs://")) {
    const path = trimmed.slice("ipfs://".length).replace(/^ipfs\//, "");
    return `${GATEWAYS[gatewayIndex % GATEWAYS.length]}${path}`;
  }
  if (trimmed.startsWith("ar://")) return `https://arweave.net/${trimmed.slice(5)}`;
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z0-9]+|bafk[a-z0-9]+|bafb[a-z0-9]+)/i.test(trimmed) && !trimmed.includes("://")) {
    return `${GATEWAYS[gatewayIndex % GATEWAYS.length]}${trimmed}`;
  }
  return trimmed;
}

export function isAllowedRemoteMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "ipfs.io" ||
      host === "cloudflare-ipfs.com" ||
      host === "gateway.pinata.cloud" ||
      host.endsWith(".mypinata.cloud") ||
      host === "w3s.link" ||
      host === "dweb.link" ||
      host === "nftstorage.link" ||
      host === "arweave.net" ||
      host.endsWith(".arweave.net")
    );
  } catch {
    return false;
  }
}

export function mediaProxyUrl(uri: string) {
  if (!uri) return "";
  if (uri.startsWith("blob:") || uri.startsWith("data:") || uri.startsWith("/")) return uri;
  return `/api/media?u=${encodeURIComponent(uri)}`;
}

export type TokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  animation_url?: string;
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
  animated?: boolean;
}): TokenMetadata {
  return {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: input.imageUri,
    animation_url: input.animated ? input.imageUri : undefined,
    external_url: input.website || undefined,
    properties: {
      twitter: input.twitter || "",
      telegram: input.telegram || "",
      discord: input.discord || "",
      website: input.website || "",
      farcaster: input.farcaster || "",
      animation: input.animated ? "true" : "false",
    },
  };
}

function looksLikeJson(type: string, url: string, bytes?: Uint8Array) {
  if (type.includes("json") || url.endsWith("metadata.json") || url.endsWith(".json")) return true;
  if (!bytes || bytes.length < 2) return false;
  const first = bytes[0];
  return first === 0x7b || first === 0x5b;
}

async function fetchWithTimeout(url: string, ms = 5_000) {
  return fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { Accept: "application/json,image/*,*/*" },
    redirect: "follow",
  });
}

const resolveCache = new Map<string, { value: string; expires: number }>();
const RESOLVE_TTL_MS = 10 * 60 * 1000;

export async function resolveLogoSrc(uri?: string | null): Promise<string> {
  if (!uri) return "";
  const source = uri.trim();
  if (!source) return "";
  if (source.startsWith("blob:") || source.startsWith("data:") || source.startsWith("/")) return source;
  const cached = resolveCache.get(source);
  if (cached && cached.expires > Date.now()) return cached.value;

  const remember = (value: string) => {
    resolveCache.set(source, { value, expires: Date.now() + RESOLVE_TTL_MS });
    return value;
  };

  for (let i = 0; i < GATEWAYS.length; i++) {
    const url = ipfsToHttp(source, i);
    if (!url) continue;
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (type.startsWith("image/")) return remember(url);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (sniffBytes(buf)?.startsWith("image/")) return remember(url);
      if (looksLikeJson(type, url, buf)) {
        try {
          const meta = JSON.parse(new TextDecoder().decode(buf)) as { image?: string; logo?: string; animation_url?: string };
          const next = meta.image || meta.animation_url || meta.logo;
          if (next && next !== source) {
            const nested = ipfsToHttp(next);
            if (nested) return remember(nested);
          }
        } catch {
          continue;
        }
      }
      return remember(url);
    } catch {
      continue;
    }
  }

  return remember(ipfsToHttp(source));
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
    animated: boolean;
    mime: string;
  };
}
