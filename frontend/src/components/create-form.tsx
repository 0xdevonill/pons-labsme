"use client";

import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeAbiParameters, keccak256, parseEther, toHex, zeroAddress, type Address, type Hex } from "viem";
import { useLaunchEnvironment } from "@/hooks/useLaunchEnvironment";
import { MediaUpload } from "./media-upload";
import { TokenPreview } from "./token-preview";
import { buildMetadata, uploadLaunchMedia } from "@/lib/ipfs";
import { V1_FACTORY, V2_FACTORY, V2_LAUNCH_AND_BUY, ZERO_ADDRESS } from "@/lib/contracts/addresses";
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
  const env = useLaunchEnvironment();

  const [generation, setGeneration] = useState<"v2" | "v1">("v2");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [socials, setSocials] = useState(emptySocials);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [pairToken, setPairToken] = useState<Address>(ZERO_ADDRESS);
  const [configId, setConfigId] = useState(0);
  const [dexId, setDexId] = useState(0);
  const [creatorTaxBps, setCreatorTaxBps] = useState(0);
  const [buybackEnabled, setBuybackEnabled] = useState(true);
  const [initialBuy, setInitialBuy] = useState("");
  const [feeWallet, setFeeWallet] = useState("");
  const [status, setStatus] = useState("");

  const v2Config = env.data?.v2.configs[configId] ?? env.data?.v2.configs[0];
  const supplyLabel = v2Config ? formatAmount(v2Config.supply, 18, 0) : "1B";

  const canSubmit = useMemo(
    () => Boolean(name.trim() && symbol.trim() && file && isConnected && !isPending),
    [name, symbol, file, isConnected, isPending],
  );

  async function launch() {
    if (!client || !address || !file) return;
    setStatus("Uploading media to IPFS…");
    const imageMeta = buildMetadata({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description.trim(),
      imageUri: "",
      ...socials,
    });
    const uploaded = await uploadLaunchMedia({
      file,
      metadata: imageMeta,
    });
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
      const fee = env.data!.v2.launchFee;
      const buy = initialBuy ? parseEther(initialBuy) : 0n;
      const params = {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        logo,
        description: description.trim(),
        socials: socialTuple,
        creatorFeeRecipient: (feeWallet || address) as Address,
        creatorTaxBps,
        buybackEnabled,
        expectedEconomics,
        salt,
      };

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
          value: pairToken === ZERO_ADDRESS ? fee + buy : fee,
        });
      } else {
        await writeContractAsync({
          address: V2_FACTORY,
          abi: v2FactoryAbi,
          functionName: "launchToken",
          args: [params, selected.id, pairToken],
          value: fee,
        });
      }
    } else {
      const selected = env.data?.v1.configs[0];
      const dex = env.data?.v1.dex[dexId] ?? env.data?.v1.dex[0];
      if (!selected || !dex) throw new Error("No V1 launch config");
      if (!env.data?.v1.launchEnabled) {
        setStatus("V1 public launches are closed. The transaction will revert unless you are whitelisted.");
      }
      const salt = keccak256(
        encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [address, BigInt(Date.now())]),
      );
      const buy = initialBuy ? parseEther(initialBuy) : 0n;
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
        value: env.data!.v1.launchFee + buy,
      });
    }

    setStatus("Launch submitted. Opening your tokens…");
    router.push("/me");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          launch().catch((error) => setStatus(error instanceof Error ? error.message : "Launch failed"));
        }}
      >
        <div className="flex rounded-full bg-white/10 p-1 text-sm">
          {(["v2", "v1"] as const).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setGeneration(item)}
              className={`flex-1 rounded-full py-2 ${generation === item ? "bg-[var(--bg0)]" : ""}`}
            >
              {item === "v2" ? "V2 bonding curve" : "V1 Uniswap V3"}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input value={name} maxLength={64} onChange={(e) => setName(e.target.value)} className="field" placeholder="Pons Duck" required />
          </Field>
          <Field label="Symbol">
            <input value={symbol} maxLength={16} onChange={(e) => setSymbol(e.target.value)} className="field" placeholder="DUCK" required />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={description} maxLength={2048} onChange={(e) => setDescription(e.target.value)} className="field min-h-28" />
        </Field>
        <MediaUpload
          file={file}
          onChange={(next, url) => {
            setFile(next);
            setPreview(url);
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {(["twitter", "telegram", "discord", "website", "farcaster"] as const).map((key) => (
            <Field key={key} label={key}>
              <input
                value={socials[key]}
                maxLength={256}
                onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
                className="field"
              />
            </Field>
          ))}
        </div>

        {generation === "v2" ? (
          <>
            <Field label="Quote asset">
              <select value={pairToken} onChange={(e) => setPairToken(e.target.value as Address)} className="field">
                {(env.data?.pairs ?? []).map((pair) => (
                  <option key={pair.address} value={pair.address}>
                    {pair.symbol}
                  </option>
                ))}
              </select>
            </Field>
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
            <Field label="Creator tax (bps, max 1000)">
              <input
                type="number"
                min={0}
                max={Number(env.data?.v2.maxCreatorTaxBps ?? 1000)}
                value={creatorTaxBps}
                onChange={(e) => setCreatorTaxBps(Number(e.target.value))}
                className="field"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={buybackEnabled} onChange={(e) => setBuybackEnabled(e.target.checked)} />
              Enable five-year buyback vest
            </label>
          </>
        ) : (
          <Field label="DEX profile">
            <select value={dexId} onChange={(e) => setDexId(Number(e.target.value))} className="field">
              {(env.data?.v1.dex ?? []).map((dex) => (
                <option key={String(dex.id)} value={Number(dex.id)}>
                  {dex.name || `DEX ${dex.id}`}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={generation === "v2" ? "Optional first buy (ETH for native pairs)" : "Optional atomic first buy (ETH)"}>
          <input value={initialBuy} onChange={(e) => setInitialBuy(e.target.value)} className="field" placeholder="0.0" />
        </Field>
        <Field label="Creator / fee recipient (optional)">
          <input value={feeWallet} onChange={(e) => setFeeWallet(e.target.value)} className="field" placeholder={address ?? "0x…"} />
        </Field>

        <p className="text-sm text-[var(--muted)]">
          Launch fee {formatAmount(generation === "v2" ? env.data?.v2.launchFee : env.data?.v1.launchFee, 18, 4)} ETH
          {generation === "v2" && !env.data?.v2.launchEnabled ? " · V2 gate is closed" : ""}
          {generation === "v1" && !env.data?.v1.launchEnabled ? " · V1 public launches are currently closed" : ""}
        </p>
        <button
          disabled={!canSubmit}
          className="h-12 w-full rounded-2xl bg-[#7dffc3] font-semibold text-[#042015] disabled:opacity-40"
        >
          {isPending ? "Waiting for wallet" : "Preview & launch"}
        </button>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      </form>
      <TokenPreview
        name={name}
        symbol={symbol}
        description={description}
        image={preview}
        pairToken={generation === "v2" ? pairToken : ZERO_ADDRESS}
        generation={generation}
        creatorTaxBps={generation === "v2" ? creatorTaxBps : 0}
        buybackEnabled={generation === "v2" && buybackEnabled}
        supplyLabel={supplyLabel}
      />
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
