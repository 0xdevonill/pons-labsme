"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLaunches } from "@/hooks/useLaunches";
import { useLaunchMeta } from "@/hooks/useLaunchMeta";
import { TokenCard } from "@/components/token-card";
import { APP_NAME } from "@/lib/brand";
import { V1_FACTORY, V2_FACTORY } from "@/lib/contracts/addresses";
import { shorten } from "@/lib/format";

export default function HomePage() {
  const launches = useLaunches({ generation: "v2" });
  const featured = launches.data?.launches.slice(0, 6) ?? [];
  const meta = useLaunchMeta(featured);
  const total = launches.data?.launches.length ?? 0;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[32px] glass px-6 py-10 md:px-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="section-kicker">Robinhood Chain · Live Pons factories</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            A quieter market for tokens that already know how to graduate.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            {APP_NAME} is an English-language launch surface for bonding curves, locked Uniswap liquidity, animated
            token art, and Pons-style creator commission. Contract addresses stay on the official Pons V1 and V2
            factories.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/create" className="btn-primary px-5">
              Create token
            </Link>
            <Link href="/explore" className="btn-secondary px-5">
              Explore launches
            </Link>
          </div>
          <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <dt className="text-xs text-[var(--muted)]">Indexed V2 launches</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-lg">{total.toLocaleString()}</dd>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <dt className="text-xs text-[var(--muted)]">V2 factory</dt>
              <dd className="mt-1 font-[family-name:var(--font-mono)] text-xs">{shorten(V2_FACTORY, 6)}</dd>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <dt className="text-xs text-[var(--muted)]">V1 factory</dt>
              <dd className="mt-1 font-[family-name:var(--font-mono)] text-xs">{shorten(V1_FACTORY, 6)}</dd>
            </div>
          </dl>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Animated art",
            copy: "Launch with GIF or animated WebP. Helix pins the original frames to IPFS and stores the metadata URI on-chain.",
          },
          {
            title: "Creator commission",
            copy: "Set an optional trade commission up to the live factory cap, the same way Pons Market does, plus a creator payout wallet.",
          },
          {
            title: "Locked graduation",
            copy: "V2 tokens climb a bonding curve, then graduate into permanently locked Uniswap V4 liquidity.",
          },
        ].map((item) => (
          <article key={item.title} className="glass rounded-[24px] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.copy}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">Live on the curve</h2>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-[var(--muted)]">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        {launches.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass shimmer h-40 rounded-3xl" />
            ))}
          </div>
        ) : launches.isError ? (
          <div className="glass rounded-3xl p-8 text-sm text-[var(--muted)]">
            Could not load launches. {launches.error.message}
          </div>
        ) : featured.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-sm text-[var(--muted)]">No V2 launches in this window yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((launch) => {
              const extra = meta.data?.[launch.token.toLowerCase()];
              return (
                <TokenCard
                  key={launch.token}
                  launch={launch}
                  name={extra?.name}
                  symbol={extra?.symbol}
                  logo={extra?.logo}
                  image={extra?.image}
                  progress={extra?.progress}
                  phaseLabel={extra?.phaseLabel}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
