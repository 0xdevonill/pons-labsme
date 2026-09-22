"use client";

import { use } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { BondingCurveProgress } from "@/components/bonding-curve";
import { GraduationBadge } from "@/components/graduation-badge";
import { TradePanel } from "@/components/trade-panel";
import { TxHistory } from "@/components/tx-history";
import { TokenLogo } from "@/components/token-logo";
import { explorerAddress, explorerToken, pairDecimals, V2_FACTORY } from "@/lib/contracts/addresses";
import { PairAssetIcon } from "@/components/pair-asset-icon";
import { usePairMeta } from "@/hooks/usePairAssets";
import { v2FactoryAbi } from "@/lib/contracts/abis";
import { formatAmount, formatBps, shorten } from "@/lib/format";
import { PHASE_LABEL, type V1Launch, type V2Launch } from "@/lib/types";

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = use(params);
  const token = isAddress(raw) ? (raw as Address) : undefined;
  const detail = useTokenDetail(token);
  const { address: wallet } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [note, setNote] = useState("");
  const launch = detail.data?.launch as V1Launch | V2Launch | undefined;
  const pairAddress = launch
    ? detail.data?.generation === "v2"
      ? (launch as V2Launch).pairToken
      : (launch as V1Launch).pairedToken
    : undefined;
  const quote = usePairMeta(pairAddress);

  if (!token) return <p>Invalid token address.</p>;
  if (detail.isLoading) return <div className="glass shimmer h-96 rounded-[32px]" />;
  if (detail.error || !detail.data) {
    return <p className="text-[var(--muted)]">{detail.error?.message || "Token not found on Fons."}</p>;
  }

  const data = detail.data;
  const threshold =
    data.generation === "v2" ? (launch as V2Launch).graduationThreshold : (data.threshold ?? 0n);
  const pair = pairAddress as Address;

  return (
    <div className="space-y-6">
      <Link href="/" className="btn-secondary h-10 px-4 text-sm">
        <ArrowLeft size={15} />
        Back to explore
      </Link>
      <div className="surface flex flex-col gap-5 rounded-[32px] p-5 md:flex-row md:p-7">
        <TokenLogo src={data.imageSrc} uri={data.meta.logo} alt={data.meta.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">{data.meta.name}</h1>
            <GraduationBadge phase={data.phase} graduated={data.graduated} />
            <span className="chip uppercase">{data.generation}</span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[var(--muted)]">
            <span>${data.meta.symbol}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <PairAssetIcon
                symbol={quote.symbol}
                name={quote.name}
                logoUrl={quote.logoUrl}
                kind={quote.kind}
                size={16}
              />
              {quote.showAddress ? quote.symbol : quote.kind === "stock" ? `${quote.symbol} · ${quote.name}` : quote.symbol}
            </span>
            <span>·</span>
            <span>{shorten(token)}</span>
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6">{data.meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href={explorerToken(token)} target="_blank" rel="noreferrer" className="chip inline-flex items-center gap-1.5 hover:text-[var(--ink)]">
              Explorer <ExternalLink size={12} />
            </a>
            <a
              href={explorerAddress((launch as V1Launch | V2Launch).deployer)}
              target="_blank"
              rel="noreferrer"
              className="chip hover:text-[var(--ink)]"
            >
              Creator {shorten((launch as V1Launch | V2Launch).deployer)}
            </a>
            {data.meta.socials.twitter ? (
              <a href={data.meta.socials.twitter} className="chip hover:text-[var(--ink)]">
                X
              </a>
            ) : null}
            {data.meta.socials.telegram ? (
              <a href={data.meta.socials.telegram} className="chip hover:text-[var(--ink)]">
                Telegram
              </a>
            ) : null}
            {data.meta.socials.website ? (
              <a href={data.meta.socials.website} className="chip hover:text-[var(--ink)]">
                Site
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <BondingCurveProgress
        progress={data.progress}
        raised={data.realQuote}
        threshold={threshold}
        pairToken={pair}
        decimals={pairDecimals(pair)}
        phaseLabel={PHASE_LABEL[data.phase]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TradePanel
          generation={data.generation}
          token={token}
          curve={data.generation === "v2" ? (launch as V2Launch).curve : undefined}
          pairToken={pair}
          quoteReserve={data.quoteReserve}
          tokenReserve={data.tokenReserve}
          sellable={data.sellable}
          feeBps={data.feeBps}
          creatorTaxBps={data.creatorTaxBps}
          snipeBps={data.snipeBps}
          poolFee={data.generation === "v1" ? (launch as V1Launch).poolFee : 0}
          graduated={data.graduated || data.phase === 2}
          readyToGraduate={data.readyToGraduate}
        />
        <section className="surface space-y-3 rounded-[28px] p-5 text-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg">Market details</h3>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2">
            <span className="text-[var(--muted)]">Quote asset</span>
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate font-medium">
              <PairAssetIcon
                symbol={quote.symbol}
                name={quote.name}
                logoUrl={quote.logoUrl}
                kind={quote.kind}
                size={16}
              />
              {quote.showAddress ? quote.symbol : quote.kind === "stock" ? `${quote.symbol} · ${quote.name}` : quote.symbol}
            </span>
          </div>
          <Row label="Trade fee" value={formatBps(data.feeBps)} />
          <Row label="Creator commission" value={formatBps(data.creatorTaxBps)} />
          {data.generation === "v2" ? (
            <Row label="Sellable on curve" value={formatAmount(data.sellable, 18, 2)} />
          ) : (
            <Row label="Restrictions end" value={String((launch as V1Launch).restrictionsEndBlock)} />
          )}
          {data.phase === 1 && data.generation === "v2" ? (
            <button
              disabled={isPending}
              onClick={() =>
                writeContractAsync({
                  address: V2_FACTORY,
                  abi: v2FactoryAbi,
                  functionName: "createGraduatedPool",
                  args: [token],
                })
                  .then(() => setNote("Graduation seed submitted."))
                  .catch((error) => setNote(error instanceof Error ? error.message : "Failed"))
              }
              className="h-11 w-full rounded-full bg-[#d4af67] font-semibold text-[#2a2108] shadow-sm hover:brightness-105 disabled:opacity-50"
            >
              Complete graduation
            </button>
          ) : null}
          {wallet && data.generation === "v2" && wallet.toLowerCase() === (launch as V2Launch).creatorFeeRecipient.toLowerCase() ? (
            <p className="text-xs text-[var(--muted)]">You are the creator fee recipient for this launch.</p>
          ) : null}
          {note ? <p className="text-xs">{note}</p> : null}
        </section>
      </div>

      <TxHistory curve={data.generation === "v2" ? (launch as V2Launch).curve : undefined} pairToken={pair} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2 last:border-b-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}
