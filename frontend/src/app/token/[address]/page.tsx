"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { BondingCurveProgress } from "@/components/bonding-curve";
import { GraduationBadge } from "@/components/graduation-badge";
import { TradePanel } from "@/components/trade-panel";
import { TxHistory } from "@/components/tx-history";
import { explorerAddress, explorerToken, pairDecimals, pairSymbol, V2_FACTORY } from "@/lib/contracts/addresses";
import { v2FactoryAbi } from "@/lib/contracts/abis";
import { formatAmount, formatBps, shorten } from "@/lib/format";
import { ipfsToHttp, resolveLogoSrc } from "@/lib/ipfs";
import { PHASE_LABEL, type V1Launch, type V2Launch } from "@/lib/types";

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = use(params);
  const token = isAddress(raw) ? (raw as Address) : undefined;
  const detail = useTokenDetail(token);
  const { address: wallet } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [logo, setLogo] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const uri = detail.data?.meta.logo;
    if (!uri) return;
    resolveLogoSrc(uri).then(setLogo).catch(() => setLogo(ipfsToHttp(uri)));
  }, [detail.data?.meta.logo]);

  if (!token) return <p>Invalid token address.</p>;
  if (detail.isLoading) return <div className="glass shimmer h-96 rounded-[32px]" />;
  if (detail.error || !detail.data) {
    return <p className="text-[var(--muted)]">{detail.error?.message || "Token not found on Pons factories."}</p>;
  }

  const data = detail.data;
  const launch = data.launch as V1Launch | V2Launch;
  const threshold =
    data.generation === "v2" ? (launch as V2Launch).graduationThreshold : (data.threshold ?? 0n);
  const pair = data.generation === "v2" ? (launch as V2Launch).pairToken : (launch as V1Launch).pairedToken;

  return (
    <div className="space-y-6">
      <div className="glass flex flex-col gap-5 rounded-[32px] p-5 md:flex-row">
        <div className="h-28 w-28 overflow-hidden rounded-3xl bg-white/10">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl">{data.meta.name}</h1>
            <GraduationBadge phase={data.phase} graduated={data.graduated} />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">{data.generation}</span>
          </div>
          <p className="text-[var(--muted)]">
            ${data.meta.symbol} · {pairSymbol(pair)} · {shorten(token)}
          </p>
          <p className="mt-3 max-w-2xl text-sm">{data.meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href={explorerToken(token)} target="_blank" rel="noreferrer" className="underline">
              Explorer
            </a>
            <a href={explorerAddress((launch as V1Launch | V2Launch).deployer)} target="_blank" rel="noreferrer">
              Creator {shorten((launch as V1Launch | V2Launch).deployer)}
            </a>
            {data.meta.socials.twitter ? <a href={data.meta.socials.twitter}>X</a> : null}
            {data.meta.socials.telegram ? <a href={data.meta.socials.telegram}>Telegram</a> : null}
            {data.meta.socials.website ? <a href={data.meta.socials.website}>Site</a> : null}
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
        <section className="glass space-y-3 rounded-3xl p-5 text-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg">Market details</h3>
          <Row label="Quote asset" value={pairSymbol(pair)} />
          <Row label="Trade fee" value={formatBps(data.feeBps)} />
          <Row label="Creator tax" value={formatBps(data.creatorTaxBps)} />
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
              className="h-11 w-full rounded-2xl bg-[#e4c56a] font-semibold text-[#2a2108]"
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
      <p className="text-xs text-[var(--muted)]">
        <Link href="/explore">Back to explore</Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
