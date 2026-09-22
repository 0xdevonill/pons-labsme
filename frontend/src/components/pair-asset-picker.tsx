"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { KNOWN_PAIR_TOKENS, ZERO_ADDRESS, pairInfo } from "@/lib/contracts/addresses";
import { formatAmount } from "@/lib/format";
import { looksLikeAddress, pairLogoSrc } from "@/lib/pair-assets";
import { cn } from "@/lib/cn";
import { usePairAssets } from "@/hooks/usePairAssets";
import { PairAssetIcon } from "./pair-asset-icon";

type PairOption = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  kind: string;
  approved?: boolean;
  graduationThreshold?: bigint;
  logoUrl?: string;
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
  const catalog = usePairAssets();
  const selected = pairInfo(value);
  const selectedMeta =
    catalog.data?.byAddress.get(selected.address.toLowerCase()) ??
    catalog.data?.bySymbol.get(selected.symbol.toUpperCase());

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
    const byAddress = catalog.data?.byAddress;
    const bySymbol = catalog.data?.bySymbol;
    return KNOWN_PAIR_TOKENS.map((token) => {
      const extra = live.get(token.address.toLowerCase());
      const meta =
        byAddress?.get(token.address.toLowerCase()) ?? bySymbol?.get(token.symbol.toUpperCase());
      return {
        ...token,
        name: token.kind === "stock" ? meta?.name || token.name : token.name,
        logoUrl:
          token.kind === "stock"
            ? meta?.logoUrl || pairLogoSrc(token.address, undefined, token.symbol)
            : undefined,
        approved: token.address === ZERO_ADDRESS ? true : Boolean(extra?.approved),
        graduationThreshold: extra?.graduationThreshold ?? 0n,
      };
    }).filter((token) => {
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return `${token.symbol} ${token.name}`.toLowerCase().includes(query);
    });
  }, [pairs, q, catalog.data]);

  return (
    <div className="relative" ref={rootRef}>
      <p className="mb-1 text-sm text-[var(--muted)]">Paired asset</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field flex h-14 items-center justify-between px-3 text-left shadow-sm"
      >
        <span className="flex min-w-0 items-center gap-3">
          <PairAssetIcon
            symbol={selected.symbol}
            name={selectedMeta?.name || selected.name}
            logoUrl={
              selected.kind === "stock"
                ? selectedMeta?.logoUrl || pairLogoSrc(selected.address, undefined, selected.symbol)
                : undefined
            }
            kind={selected.kind}
          />
          <span className="min-w-0">
            <span className="block font-medium leading-5">{selected.symbol}</span>
            <span className="block truncate text-xs text-[var(--muted)]">
              {selected.kind === "stock" ? selectedMeta?.name || selected.name : selected.name}
            </span>
          </span>
        </span>
        <span className="text-[var(--muted)]">▾</span>
      </button>
      {open ? (
        <div className="surface absolute z-30 mt-2 w-full overflow-hidden rounded-2xl">
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
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-black/5 disabled:opacity-40",
                  option.address.toLowerCase() === value.toLowerCase() && "bg-black/5",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <PairAssetIcon
                    symbol={option.symbol}
                    name={option.name}
                    logoUrl={option.logoUrl}
                    kind={option.kind}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium leading-5">{option.symbol}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">{option.name}</span>
                  </span>
                </span>
                {option.kind === "stock" ? (
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">Stock</span>
                ) : looksLikeAddress(option.symbol) ? (
                  <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted)]">
                    {option.address.slice(0, 6)}…{option.address.slice(-4)}
                  </span>
                ) : null}
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
