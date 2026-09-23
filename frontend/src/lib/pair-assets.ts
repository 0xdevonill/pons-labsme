export type PairAssetMeta = {
  symbol: string;
  name: string;
  logoUrl: string;
  address: string;
};

export const ROBINHOOD_ASSETS_URL = "https://api.robinhood.com/rhj/assets";
export const ROBINHOOD_LOGO_CDN = "https://cdn.robinhood.com/ncw_assets/logos";

export function robinhoodLogoUrl(address: string) {
  return `${ROBINHOOD_LOGO_CDN}/${address.toLowerCase()}.png`;
}

/** Hosted 128×128 pair marks for the non-stock quote assets. */
export const HOSTED_PAIR_LOGOS: Record<string, string> = {
  ETH: "/pair-logos/ETH.png",
  USDG: "/pair-logos/USDG.png",
  CBBTC: "/pair-logos/cbBTC.png",
  WETH: "/pair-logos/WETH.png",
};

export function hostedPairLogo(symbol?: string) {
  if (!symbol) return "";
  return HOSTED_PAIR_LOGOS[symbol.toUpperCase()] ?? "";
}

export function pairLogoSrc(address?: string, remoteUrl?: string, symbol?: string) {
  const hosted = hostedPairLogo(symbol);
  if (hosted) return hosted;
  const params = new URLSearchParams();
  if (address) params.set("address", address);
  if (symbol && !symbol.startsWith("0x") && !symbol.includes("…")) params.set("symbol", symbol);
  if (remoteUrl?.startsWith("https://cdn.robinhood.com/ncw_assets/logos/")) params.set("url", remoteUrl);
  return params.size ? `/api/pair-logo?${params.toString()}` : remoteUrl ?? "";
}

export function looksLikeAddress(value?: string) {
  return Boolean(value && (value.startsWith("0x") || value.includes("…")));
}

export function cleanPairName(official: string, fallback = "") {
  const cleaned = official.replace(/\s*[•·]\s*Robinhood Token\s*$/i, "").trim();
  if (!cleaned) return fallback;
  if (cleaned.length > 32) return fallback || cleaned;
  return cleaned;
}

export function pairDisplayName(meta: { name?: string; symbol?: string; address?: string; kind?: string }) {
  if (meta.kind === "stock" || (meta.name && !meta.name.startsWith("0x"))) {
    return cleanPairName(meta.name ?? "", meta.symbol ?? "");
  }
  if (meta.symbol && !meta.symbol.startsWith("0x")) return meta.symbol;
  if (meta.address) return `${meta.address.slice(0, 6)}…${meta.address.slice(-4)}`;
  return "Unknown";
}
