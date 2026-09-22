"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const LETTER_COLORS: Record<string, string> = {
  ETH: "bg-[#627eea]",
  WETH: "bg-[#627eea]",
  USDG: "bg-[#2e7d32]",
  cbBTC: "bg-[#f7931a]",
};

export function PairAssetIcon({
  symbol,
  name,
  logoUrl,
  kind,
  size = 28,
}: {
  symbol: string;
  name?: string;
  logoUrl?: string;
  kind?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !failed && kind !== "native";

  if (showLogo && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name || symbol}
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-white object-cover shadow-sm"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-[10px] font-bold text-white",
        LETTER_COLORS[symbol] || "bg-[#444]",
      )}
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 1)}
    </span>
  );
}
