"use client";

import { useAccount, usePublicClient, useSendTransaction, useWriteContract } from "wagmi";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeAbiParameters, keccak256, parseEther, toHex, zeroAddress, type Address, type Hex } from "viem";
import { useLaunchEnvironment } from "@/hooks/useLaunchEnvironment";
import { MediaUpload } from "./media-upload";
import { TokenPreview } from "./token-preview";
import { CreatorCommission } from "./creator-commission";
import { PairAssetPicker } from "./pair-asset-picker";
import { buildMetadata, uploadLaunchMedia } from "@/lib/ipfs";
import { FONS_FEE_RECIPIENT, PLATFORM_FEE_ETH } from "@/lib/brand";
import { platformFeeDue } from "@/lib/fees";
import { pairInfo, V1_FACTORY, V2_FACTORY, V2_LAUNCH_AND_BUY, ZERO_ADDRESS } from "@/lib/contracts/addresses";
import { erc20Abi, v1FactoryAbi, v2FactoryAbi, v2LaunchAndBuyAbi } from "@/lib/contracts/abis";
import { formatAmount } from "@/lib/format";
import { emptySocials } from "@/lib/types";

function randomSalt(): Hex {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function CreateForm() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const env = useLaunchEnvironment();

  const [generation, setGeneration] = useState<"v2" | "v1">("v2");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [socials, setSocials] = useState(emptySocials);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [animated, setAnimated] = useState(false);
  const [pairToken, setPairToken] = useState<Address>(ZERO_ADDRESS);
  const [configId, setConfigId] = useState(0);
  const [dexId, setDexId] = useState(0);
  const [creatorTaxBps, setCreatorTaxBps] = useState(0);
  const [buybackEnabled, setBuybackEnabled] = useState(true);
  const [initialBuy, setInitialBuy] = useState("");
  const [feeWallet, setFeeWallet] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [status, setStatus] = useState("");

  const v2Config = env.data?.v2.configs.find((c) => Number(c.id) === configId) ?? env.data?.v2.configs[0];
  const supplyLabel = v2Config ? formatAmount(v2Config.supply, 18, 0) : "1B";
  const maxCreatorTaxBps = Number(env.data?.v2.maxCreatorTaxBps ?? 1000);
  const curveFeeBps = Number(v2Config?.curveFeeBps ?? 100);
  const pair = pairInfo(pairToken);
  const pairMeta = env.data?.pairs.find((p) => p.address.toLowerCase() === pairToken.toLowerCase());
  const threshold = pairMeta?.graduationThreshold ?? v2Config?.graduationThreshold ?? 0n;
  const graduationLabel = threshold
    ? `${formatAmount(threshold, pair.decimals, 4)} ${pair.symbol}`
    : `— ${pair.symbol}`;
  const fees = platformFeeDue(generation === "v2" ? env.data?.v2.launchFee : env.data?.v1.launchFee);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && symbol.trim() && file && isConnected && !isPending),
    [name, symbol, file, isConnected, isPending],
  );

  async function collectPlatformFee() {
    if (fees.extra <= 0n) return;
    if (!FONS_FEE_RECIPIENT || FONS_FEE_RECIPIENT === ZERO_ADDRESS) return;
    setStatus("Paying the 0.005 ETH Fons platform fee…");
    await sendTransactionAsync({ to: FONS_FEE_RECIPIENT, value: fees.extra });
  }

  async function launch() {
    if (!client || !address || !file) return;
    setStatus("Uploading media to IPFS. Animation is kept as uploaded.");
    const imageMeta = buildMetadata({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description.trim(),
      imageUri: "",
      animated,
      ...socials,
    });
    const uploaded = await uploadLaunchMedia({ file, metadata: imageMeta });
    const logo = uploaded.metadataUri;
    if (logo.length > 512) throw new Error("Metadata URI exceeds on-chain logo length cap.");

    const socialTuple = {
      twitter: socials.twitter.trim(),
      telegram: socials.telegram.trim(),
      discord: socials.discord.trim(),
      website: socials.website.trim(),
      farcaster: socials.farcaster.trim(),
    };

    if (generation === "v2") {
      const selected = env.data?.v2.configs.find((c) => Number(c.id) === configId) ?? env.data?.v2.configs[0];
      if (!selected) throw new Error("No V2 launch config");
      const livePair = env.data?.pairs.find((p) => p.address.toLowerCase() === pairToken.toLowerCase());
      if (pairToken !== ZERO_ADDRESS && !livePair?.approved) {
        throw new Error(`${pair.symbol} is not an approved quote asset on the live factory right now.`);
      }
      const can = await client.readContract({
        address: V2_FACTORY,
        abi: v2FactoryAbi,
        functionName: "canLaunch",
        args: [address],
      });
      if (!can) throw new Error("This wallet is not allowed to launch on V2 right now.");

      const expectedEconomics = await client.readContract({
        address: V2_FACTORY,
        abi: v2FactoryAbi,
        functionName: "previewLaunchEconomics",
        args: [selected.id, pairToken],
      });
      const salt = randomSalt();
      const buy = initialBuy ? parseEther(initialBuy) : 0n;
      const tax = Math.min(maxCreatorTaxBps, Math.max(0, Math.round(creatorTaxBps)));
      const params = {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        logo,
        description: description.trim(),
        socials: socialTuple,
        creatorFeeRecipient: (feeWallet || address) as Address,
        creatorTaxBps: tax,
        buybackEnabled,
        expectedEconomics,
        salt,
      };

      await collectPlatformFee();
      setStatus("Confirm the launch in your wallet…");
      if (buy > 0n) {
        if (pairToken !== ZERO_ADDRESS) {
          await writeContractAsync({
            address: pairToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [V2_LAUNCH_AND_BUY, buy],
          });
        }
        await writeContractAsync({
          address: V2_LAUNCH_AND_BUY,
          abi: v2LaunchAndBuyAbi,
          functionName: "launchAndBuy",
          args: [params, selected.id, pairToken, buy, 0n, address, []],
          value: pairToken === ZERO_ADDRESS ? fees.factory + buy : fees.factory,
        });
      } else {
        await writeContractAsync({
          address: V2_FACTORY,
          abi: v2FactoryAbi,
          functionName: "launchToken",
          args: [params, selected.id, pairToken],
          value: fees.factory,
        });
      }
    } else {
      const selected = env.data?.v1.configs[0];
      const dex = env.data?.v1.dex[dexId] ?? env.data?.v1.dex[0];
      if (!selected || !dex) throw new Error("No V1 launch config");
      const salt = keccak256(
        encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [address, BigInt(Date.now())]),
      );
      const buy = initialBuy ? parseEther(initialBuy) : 0n;
      await collectPlatformFee();
      setStatus("Confirm the V1 launch in your wallet…");
      await writeContractAsync({
        address: V1_FACTORY,
        abi: v1FactoryAbi,
        functionName: "launchToken",
        args: [
          {
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            logo,
            description: description.trim(),
            socials: socialTuple,
            feeWallet: (feeWallet || zeroAddress) as Address,
          },
          selected.id,
          dex.id,
          salt,
        ] as const,
        value: fees.factory + buy,
      });
    }

    setStatus("Launch submitted. Opening your tokens…");
    router.push("/me");
  }

  return (
    <div className="overflow-hidden rounded-[32px] bg-white shadow-sm dark:bg-[var(--panel)] lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        className="space-y-4 p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          launch().catch((error) => setStatus(error instanceof Error ? error.message : "Launch failed"));
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Launch token</h1>
          <div className="flex rounded-full bg-[#f3f3f3] p-1 text-sm dark:bg-white/10">
            {(["v2", "v1"] as const).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setGeneration(item)}
                className={`rounded-full px-3 py-1 ${generation === item ? "bg-white shadow-sm dark:bg-black" : "text-[var(--muted)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input value={name} maxLength={64} onChange={(e) => setName(e.target.value)} className="field" placeholder="Token name" required />
          </Field>
          <Field label="Ticker">
            <input value={symbol} maxLength={16} onChange={(e) => setSymbol(e.target.value)} className="field" placeholder="symbol" required />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            value={description}
            maxLength={2048}
            onChange={(e) => setDescription(e.target.value)}
            className="field min-h-24"
            placeholder="A short description of the token"
          />
        </Field>
        <div>
          <p className="mb-1 text-sm text-[var(--muted)]">Token image</p>
          <MediaUpload
            file={file}
            onChange={(next, url, nextAnimated) => {
              setFile(next);
              setPreview(url);
              setAnimated(nextAnimated);
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="X profile">
            <input value={socials.twitter} maxLength={256} onChange={(e) => setSocials((s) => ({ ...s, twitter: e.target.value }))} className="field" placeholder="x.com/handle" />
          </Field>
          <Field label="Telegram">
            <input value={socials.telegram} maxLength={256} onChange={(e) => setSocials((s) => ({ ...s, telegram: e.target.value }))} className="field" placeholder="t.me/community" />
          </Field>
        </div>

        {generation === "v2" ? (
          <>
            <PairAssetPicker value={pairToken} onChange={setPairToken} pairs={env.data?.pairs ?? []} />
            <Field label={`Developer buy (${pair.symbol})`}>
              <input value={initialBuy} onChange={(e) => setInitialBuy(e.target.value)} className="field" placeholder="0.00" />
            </Field>
            <button type="button" onClick={() => setAdvanced((v) => !v)} className="text-sm text-[var(--muted)]">
              Advanced {advanced ? "▴" : "▾"}
            </button>
            {advanced ? (
              <div className="space-y-4">
                {(env.data?.v2.configs.length ?? 0) > 1 ? (
                  <Field label="Launch config">
                    <select value={configId} onChange={(e) => setConfigId(Number(e.target.value))} className="field">
                      {(env.data?.v2.configs ?? []).map((config) => (
                        <option key={String(config.id)} value={Number(config.id)}>
                          Config {String(config.id)} · fee {Number(config.curveFeeBps) / 100}%
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Creator wallet">
                  <input value={feeWallet} onChange={(e) => setFeeWallet(e.target.value)} className="field" placeholder={address ?? "0x…"} />
                </Field>
                <CreatorCommission
                  value={Math.min(maxCreatorTaxBps, creatorTaxBps)}
                  maxBps={maxCreatorTaxBps}
                  curveFeeBps={curveFeeBps}
                  onChange={setCreatorTaxBps}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={buybackEnabled} onChange={(e) => setBuybackEnabled(e.target.checked)} />
                  Enable five-year buyback vest
                </label>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Field label="DEX profile">
              <select value={dexId} onChange={(e) => setDexId(Number(e.target.value))} className="field">
                {(env.data?.v1.dex ?? []).map((dex) => (
                  <option key={String(dex.id)} value={Number(dex.id)}>
                    {dex.name || `DEX ${dex.id}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Optional atomic first buy (ETH)">
              <input value={initialBuy} onChange={(e) => setInitialBuy(e.target.value)} className="field" placeholder="0.0" />
            </Field>
            <Field label="Creator / fee recipient (optional)">
              <input value={feeWallet} onChange={(e) => setFeeWallet(e.target.value)} className="field" placeholder={address ?? "0x…"} />
            </Field>
          </>
        )}

        <p className="text-sm text-[var(--muted)]">
          {pair.symbol} pair · launch fee {PLATFORM_FEE_ETH} ETH
          {generation === "v2" && env.data && !env.data.v2.launchEnabled ? " · V2 gate is closed" : ""}
        </p>
        <button disabled={!canSubmit} className="btn-primary h-12 w-full rounded-full text-base">
          {!isConnected ? "Connect wallet" : isPending ? "Waiting for wallet" : `Launch · ${PLATFORM_FEE_ETH} ETH`}
        </button>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      </form>
      <div className="bg-[#f6f6f6] p-6 dark:bg-black/20 md:p-8">
        <TokenPreview
          name={name}
          symbol={symbol}
          description={description}
          image={preview}
          pairToken={generation === "v2" ? pairToken : ZERO_ADDRESS}
          creatorTaxBps={generation === "v2" ? creatorTaxBps : 0}
          buybackEnabled={generation === "v2" && buybackEnabled}
          supplyLabel={supplyLabel}
          animated={animated}
          curveFeeBps={generation === "v2" ? curveFeeBps : 0}
          graduationLabel={graduationLabel}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
