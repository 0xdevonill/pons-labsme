"use client";

import { useAccount } from "wagmi";
import { useLaunches } from "@/hooks/useLaunches";
import { SearchFilters } from "@/components/search-filters";
import { ConnectButton } from "@/components/connect-button";

export default function MyTokensPage() {
  const { address, isConnected } = useAccount();
  const launches = useLaunches({ deployer: address, enabled: Boolean(address) });
  const list = launches.data?.launches ?? [];

  return (
    <div>
      <p className="section-kicker">Portfolio</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-5xl">My tokens</h1>
      <p className="mt-2 mb-6 max-w-xl text-[var(--muted)]">
        Tokens this wallet launched on Fons.
      </p>
      {!isConnected ? (
        <div className="surface flex flex-col items-start gap-4 rounded-[32px] p-8">
          <p>Connect a Robinhood Network wallet to see your launches.</p>
          <ConnectButton />
        </div>
      ) : launches.isLoading ? (
        <div className="glass shimmer h-64 rounded-[32px]" />
      ) : launches.isError ? (
        <div className="surface rounded-[32px] p-8 text-sm text-[var(--muted)]">
          Could not load your launches. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} showPinned={false} />
      )}
    </div>
  );
}
