"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { KNOWN_PAIR_TOKENS, ZERO_ADDRESS, pairInfo } from "@/lib/contracts/addresses";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/cn";

type PairOption = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  kind: string;
  approved?: boolean;
  graduationThreshold?: bigint;
};

export function PairAssetPicker({
  value,
  onChange,
  pairs,
}: {
  value: Address;
  onChange: (address: Address) => void;
  pairs: PairOption[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = pairInfo(value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = useMemo(() => {
    const live = new Map(pairs.map((pair) => [pair.address.toLowerCase(), pair]));
    return KNOWN_PAIR_TOKENS.map((token) => {
      const extra = live.get(token.address.toLowerCase());
      return {
        ...token,
        approved: token.address === ZERO_ADDRESS ? true : Boolean(extra?.approved),
        graduationThreshold: extra?.graduationThreshold ?? 0n,
      };
    }).filter((token) => {
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return `${token.symbol} ${token.name}`.toLowerCase().includes(query);
    });
  }, [pairs, q]);

  return (
    <div className="relative" ref={rootRef}>
      <p className="mb-1 text-sm text-[var(--muted)]">Paired asset</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field flex h-12 items-center justify-between px-3 text-left"
      >
        <span className="flex items-center gap-2">
          <PairDot symbol={selected.symbol} />
          <span className="font-medium">{selected.symbol}</span>
        </span>
        <span className="text-[var(--muted)]">▾</span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ETH, NVDA, TSLA…"
            className="h-11 w-full border-b border-[var(--line)] bg-transparent px-3 text-sm outline-none"
          />
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                type="button"
                key={option.address}
                disabled={!option.approved}
                onClick={() => {
                  onChange(option.address);
                  setOpen(false);
                  setQ("");
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-black/5 disabled:opacity-40",
                  option.address.toLowerCase() === value.toLowerCase() && "bg-black/5",
                )}
              >
                <span className="flex items-center gap-2">
                  <PairDot symbol={option.symbol} />
                  <span className="font-medium">{option.symbol}</span>
                </span>
                <span className="text-[var(--muted)]">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <GraduationHint address={value} pairs={pairs} />
    </div>
  );
}

function GraduationHint({ address, pairs }: { address: Address; pairs: PairOption[] }) {
  const match = pairs.find((pair) => pair.address.toLowerCase() === address.toLowerCase());
  const info = pairInfo(address);
  const threshold = match?.graduationThreshold ?? 0n;
  if (!threshold) {
    return <p className="mt-1 text-xs text-[var(--muted)]">Reading the graduation threshold.</p>;
  }
  return (
    <p className="mt-1 text-xs text-[var(--muted)]">
      Graduates once the curve raises {formatAmount(threshold, info.decimals, 4)} {info.symbol}.
    </p>
  );
}

function PairDot({ symbol }: { symbol: string }) {
  const colors: Record<string, string> = {
    ETH: "bg-[#627eea]",
    NVDA: "bg-[#76b900]",
    TSLA: "bg-[#e31937]",
    AAPL: "bg-[#111]",
    GOOGL: "bg-[#4285f4]",
    GME: "bg-[#111]",
    SPCX: "bg-[#111]",
    USDG: "bg-[#2e7d32]",
    cbBTC: "bg-[#f7931a]",
    SPY: "bg-[#1e3a8a]",
  };
  return (
    <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white", colors[symbol] || "bg-[#444]")}>
      {symbol.slice(0, 1)}
    </span>
  );
}
