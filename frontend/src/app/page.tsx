"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLaunches } from "@/hooks/useLaunches";
import { useLaunchMeta } from "@/hooks/useLaunchMeta";
import { TokenCard } from "@/components/token-card";

export default function HomePage() {
  const launches = useLaunches({ generation: "v2" });
  const featured = launches.data?.launches.slice(0, 6) ?? [];
  const meta = useLaunchMeta(featured);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] glass px-6 py-10 md:px-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Robinhood Chain · Pons V1 & V2</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] md:text-6xl">
            Launch a token that already knows how to graduate.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            A redesigned Pons surface on the live factories. Bonding curves, locked Uniswap liquidity,
            and Robinhood Network wallets — no contract changes.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/create" className="rounded-full bg-[#7dffc3] px-5 py-3 text-sm font-semibold text-[#042015]">
              Create token
            </Link>
            <Link href="/explore" className="glass rounded-full px-5 py-3 text-sm">
              Explore launches
            </Link>
          </div>
        </motion.div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Live on the curve</h2>
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
