"use client";

import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useState } from "react";
import { parseUnits, formatUnits, type Address } from "viem";
import { v2CurveAbi, erc20Abi, swapRouter02Abi, v1TokenAbi } from "@/lib/contracts/abis";
import { ZERO_ADDRESS, V1_SWAP_ROUTER, pairDecimals, pairSymbol } from "@/lib/contracts/addresses";
import { minOutFromRate, quoteBuy, quoteSell } from "@/lib/quote";
import { formatAmount } from "@/lib/format";

export function TradePanel({
  generation,
  token,
  curve,
  pairToken,
  quoteReserve,
  tokenReserve,
  sellable,
  feeBps,
  creatorTaxBps,
  snipeBps,
  poolFee,
  graduated,
  readyToGraduate,
}: {
  generation: "v1" | "v2";
  token: Address;
  curve?: Address;
  pairToken: Address;
  quoteReserve: bigint;
  tokenReserve: bigint;
  sellable: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  snipeBps: bigint;
  poolFee?: number;
  graduated: boolean;
  readyToGraduate: boolean;
}) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const decimals = pairDecimals(pairToken);
  const native = pairToken === ZERO_ADDRESS;

  const parsed = (() => {
    try {
      return amount ? parseUnits(amount, side === "buy" ? decimals : 18) : 0n;
    } catch {
      return 0n;
    }
  })();

  const quoted =
    generation === "v2" && side === "buy"
      ? quoteBuy({
          quoteIn: parsed,
          quoteReserve,
          tokenReserve,
          sellable,
          feeBps,
          creatorTaxBps,
          snipeBps,
        })
      : generation === "v2"
        ? { tokensOut: 0n, spent: 0n, refund: 0n, quoteOut: quoteSell({ tokensIn: parsed, quoteReserve, tokenReserve, feeBps, creatorTaxBps }).quoteOut }
        : null;

  async function submit() {
    if (!address) {
      setStatus("Connect a Robinhood Network wallet first.");
      return;
    }
    setStatus("");
    try {
      if (generation === "v2") {
        if (!curve) throw new Error("No curve");
        if (graduated || (side === "sell" && readyToGraduate)) {
          throw new Error("Curve is closed. This token trades on Uniswap V4.");
        }
        if (side === "buy") {
          if (!native) {
            const allowance = await client!.readContract({
              address: pairToken,
              abi: erc20Abi,
              functionName: "allowance",
              args: [address, curve],
            });
            if (allowance < parsed) {
              await writeContractAsync({
                address: pairToken,
                abi: erc20Abi,
                functionName: "approve",
                args: [curve, parsed],
              });
            }
          }
          const minOut = minOutFromRate("tokensOut" in quoted! ? quoted!.tokensOut : 0n, 100n);
          await writeContractAsync({
            address: curve,
            abi: v2CurveAbi,
            functionName: "buy",
            args: [parsed, minOut, address],
            value: native ? parsed : 0n,
          });
        } else {
          const allowance = await client!.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, curve],
          });
          if (allowance < parsed) {
            await writeContractAsync({
              address: token,
              abi: erc20Abi,
              functionName: "approve",
              args: [curve, parsed],
            });
          }
          const minOut = minOutFromRate(quoted && "quoteOut" in quoted ? quoted.quoteOut : 0n, 100n);
          await writeContractAsync({
            address: curve,
            abi: v2CurveAbi,
            functionName: "sell",
            args: [parsed, minOut, address],
          });
        }
      } else {
        if (side === "sell") {
          await writeContractAsync({
            address: token,
            abi: v1TokenAbi,
            functionName: "approve",
            args: [V1_SWAP_ROUTER, parsed],
          });
        }
        const tokenIn = side === "buy" ? pairToken : token;
        const tokenOut = side === "buy" ? token : pairToken;
        await writeContractAsync({
          address: V1_SWAP_ROUTER,
          abi: swapRouter02Abi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn,
              tokenOut,
              fee: poolFee ?? 10_000,
              recipient: address,
              amountIn: parsed,
              amountOutMinimum: 0n,
              sqrtPriceLimitX96: 0n,
            },
          ],
          value: side === "buy" && native ? parsed : 0n,
        });
      }
      setStatus("Transaction submitted.");
      setAmount("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Trade failed");
    }
  }

  if (generation === "v2" && graduated) {
    return (
      <section className="glass rounded-3xl p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg">Trade</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This launch has graduated. Buys and sells now route through the locked Uniswap V4 pool
          (hook fee, pool fee 0).
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-4 flex rounded-full bg-white/10 p-1 text-sm">
        {(["buy", "sell"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setSide(item)}
            className={`flex-1 rounded-full py-2 capitalize ${side === item ? "bg-[var(--bg0)]" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="text-xs text-[var(--muted)]">
        {side === "buy" ? `Spend ${pairSymbol(pairToken)}` : "Sell tokens"}
      </label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="0.0"
        className="mt-1 h-12 w-full rounded-2xl bg-white/10 px-4 outline-none"
      />
      {generation === "v2" && quoted ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {side === "buy"
            ? `≈ ${formatAmount("tokensOut" in quoted ? quoted.tokensOut : 0n, 18, 4)} tokens`
            : `≈ ${formatAmount("quoteOut" in quoted ? quoted.quoteOut : 0n, decimals, 4)} ${pairSymbol(pairToken)}`}
          {" · "}
          {Number(feeBps + creatorTaxBps) / 100}% fee
          {snipeBps > 0n ? ` · snipe ${Number(snipeBps) / 100}%` : ""}
        </p>
      ) : null}
      <button
        disabled={isPending || parsed === 0n}
        onClick={submit}
        className="mt-4 h-12 w-full rounded-2xl bg-[#7dffc3] font-semibold text-[#042015] disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet" : side === "buy" ? "Buy" : "Sell"}
      </button>
      {status ? <p className="mt-3 text-sm text-[var(--muted)]">{status}</p> : null}
      {generation === "v2" ? (
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          Quotes use on-chain reserves. Partial fills near graduation refund unused {pairSymbol(pairToken)}.
          {formatUnits(sellable, 18) ? ` Sellable: ${formatAmount(sellable, 18, 2)}.` : ""}
        </p>
      ) : null}
    </section>
  );
}
