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
      <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">My tokens</h1>
      <p className="mt-2 mb-6 text-[var(--muted)]">
        Tokens this wallet launched on Pons V1 or V2.
      </p>
      {!isConnected ? (
        <div className="glass flex flex-col items-start gap-4 rounded-3xl p-8">
          <p>Connect a Robinhood Network wallet to see your launches.</p>
          <ConnectButton />
        </div>
      ) : launches.isLoading ? (
        <div className="glass shimmer h-64 rounded-3xl" />
      ) : launches.isError ? (
        <div className="glass rounded-3xl p-8 text-sm text-[var(--muted)]">
          Could not load your launches. {launches.error.message}
        </div>
      ) : (
        <SearchFilters launches={list} />
      )}
    </div>
  );
}
