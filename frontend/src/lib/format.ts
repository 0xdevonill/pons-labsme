import { formatUnits, type Address } from "viem";

export function shorten(address: string, size = 4) {
  if (!address) return "";
  return `${address.slice(0, 2 + size)}…${address.slice(-size)}`;
}

export function formatAmount(value: bigint | undefined, decimals = 18, digits = 4) {
  if (value === undefined) return "—";
  const asNumber = Number(formatUnits(value, decimals));
  if (!Number.isFinite(asNumber)) return formatUnits(value, decimals);
  if (asNumber === 0) return "0";
  if (asNumber > 0 && asNumber < 1 / 10 ** digits) return `<${(1 / 10 ** digits).toFixed(digits)}`;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    notation: asNumber >= 1_000_000 ? "compact" : "standard",
  }).format(asNumber);
}

export function formatPct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatBps(bps: bigint | number) {
  const n = Number(bps);
  const pct = n / 100;
  if (!Number.isFinite(pct)) return "—";
  const digits = pct % 1 === 0 ? 0 : Math.round(pct * 10) % 1 === 0 ? 1 : 2;
  return `${pct.toFixed(digits)}%`;
}

export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function isAddressLike(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function timeAgo(date: Date | number) {
  const ts = typeof date === "number" ? date : date.getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
