"use client";

import { formatBps } from "@/lib/format";

const PRESETS = [0, 100, 250, 500, 1000];

export function CreatorCommission({
  value,
  maxBps,
  curveFeeBps,
  onChange,
}: {
  value: number;
  maxBps: number;
  curveFeeBps: number;
  onChange: (bps: number) => void;
}) {
  const cap = Math.max(0, maxBps || 1000);
  const clamped = Math.min(cap, Math.max(0, value));
  const traderPays = curveFeeBps + clamped;

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Creator commission</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Optional extra fee on every trade, paid to your creator wallet. Same control as Pons Market, capped at{" "}
            {formatBps(cap)} and fixed at launch.
          </p>
        </div>
        <p className="font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums">
          {formatBps(clamped)}
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={cap}
        step={25}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="commission-range mt-4 w-full"
        aria-label="Creator commission"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.filter((bps) => bps <= cap).map((bps) => (
          <button
            key={bps}
            type="button"
            onClick={() => onChange(bps)}
            className={`chip ${clamped === bps ? "chip-active" : ""}`}
          >
            {formatBps(bps)}
          </button>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <dt className="text-[var(--muted)]">Protocol trade fee</dt>
          <dd className="mt-0.5 font-medium">{formatBps(curveFeeBps)}</dd>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <dt className="text-[var(--muted)]">Your commission</dt>
          <dd className="mt-0.5 font-medium">{formatBps(clamped)}</dd>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2 sm:col-span-1">
          <dt className="text-[var(--muted)]">Traders pay</dt>
          <dd className="mt-0.5 font-medium">{formatBps(traderPays)}</dd>
        </div>
      </dl>
    </section>
  );
}
