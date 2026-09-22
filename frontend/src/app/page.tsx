"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default function HomePage() {
  const launches = useLaunches({ generation: "all" });
  const list = launches.data?.launches ?? [];

  return (
    <div className="space-y-6">
      <section className="page-hero px-6 py-8 md:px-10 md:py-12">
        <p className="section-kicker">Robinhood Chain launchpad</p>
        <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-6xl">
          Launch tokens on {APP_NAME}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] md:text-base">
          {APP_TAGLINE}. Pair against ETH, USDG, or tokenized stocks. Every trade and launch is signed
          in your wallet.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/create" className="btn-primary h-12 px-6">
            <Sparkles size={16} />
            Launch a token
          </Link>
          <Link href="/explore" className="btn-secondary h-12 px-5">
            Browse market
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {launches.isLoading ? (
        <div className="launchpad-panel shimmer h-96 rounded-[32px]" />
      ) : launches.isError ? (
        <div className="surface rounded-[32px] p-8 text-sm text-[var(--muted)]">
          Could not load launches. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} showPinned />
      )}
    </div>
  );
}
