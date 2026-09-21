"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { shorten } from "@/lib/format";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { cn } from "@/lib/cn";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    const wrong = chainId !== ROBINHOOD_CHAIN_ID;
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn("flex h-10 items-center gap-2 rounded-full bg-black px-3 text-sm text-white", wrong && "bg-amber-500")}
        >
          <span className="h-2 w-2 rounded-full bg-[#d6ff3a]" />
          {shorten(address)}
          <ChevronDown size={14} />
        </button>
        {open ? (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 text-sm shadow-lg">
            {wrong ? (
              <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-black/5" onClick={() => switchChain({ chainId: ROBINHOOD_CHAIN_ID })}>
                Switch to Robinhood Chain
              </button>
            ) : (
              <p className="px-3 py-2 text-[var(--muted)]">Robinhood Chain</p>
            )}
            <button
              className="w-full rounded-xl px-3 py-2 text-left hover:bg-black/5"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-primary h-10 px-4 text-sm">
        Connect
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-lg">
          <p className="px-3 pb-2 pt-1 text-xs uppercase tracking-wide text-[var(--muted)]">Robinhood Network</p>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              disabled={isPending}
              onClick={() => {
                connect({ connector, chainId: ROBINHOOD_CHAIN_ID });
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
            >
              <span>{connector.name === "Injected" ? "Robinhood Wallet / Browser" : connector.name}</span>
            </button>
          ))}
          {connectors.length === 0 ? (
            <button className="w-full rounded-xl px-3 py-2 text-left text-sm" onClick={() => connect({ connector: injected(), chainId: ROBINHOOD_CHAIN_ID })}>
              Browser wallet
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
