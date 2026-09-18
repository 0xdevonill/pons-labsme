import type { Address } from "viem";
import {
  V1_FACTORY,
  V2_FACTORY,
  ZERO_ADDRESS,
  pairDecimals,
} from "./contracts/addresses";
import {
  v1FactoryAbi,
  v1TokenAbi,
  v2CurveAbi,
  v2FactoryAbi,
  v2TokenAbi,
} from "./contracts/abis";
import { emptySocials, type GraduationPhase, type TokenMeta, type V1Launch, type V2Launch } from "./types";
import { graduationProgress } from "./quote";
import { makeRpcClient, withRetries } from "./rpc";

export type TokenDetail = {
  generation: "v1" | "v2";
  launch: V1Launch | V2Launch;
  meta: TokenMeta;
  quoteReserve: bigint;
  tokenReserve: bigint;
  realQuote: bigint;
  sellable: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  readyToGraduate: boolean;
  graduated: boolean;
  snipeBps: bigint;
  policy: unknown;
  progress: number;
  phase: GraduationPhase;
  pairDecimals: number;
  threshold?: bigint;
};

function asMeta(info: readonly unknown[], name: string, symbol: string): TokenMeta {
  const socials = (info[3] as TokenMeta["socials"] | undefined) ?? emptySocials;
  return {
    name,
    symbol,
    logo: String(info[1] ?? ""),
    description: String(info[2] ?? ""),
    socials,
  };
}

export async function loadTokenDetail(address: Address): Promise<TokenDetail> {
  const client = makeRpcClient();

  return withRetries(async () => {
    const v2 = (await client.readContract({
      address: V2_FACTORY,
      abi: v2FactoryAbi,
      functionName: "getLaunchedToken",
      args: [address],
    })) as V2Launch;

    if (v2.exists) {
      const [info, name, symbol, curveState, policy, realQuote, sellable, feeBps, creatorTaxBps, ready, graduated, snipe] =
        await Promise.all([
          client.readContract({ address, abi: v2TokenAbi, functionName: "getTokenInfo" }),
          client.readContract({ address, abi: v2TokenAbi, functionName: "name" }),
          client.readContract({ address, abi: v2TokenAbi, functionName: "symbol" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "getReserves" }).catch(() => [0n, 1n] as const),
          client.readContract({ address: V2_FACTORY, abi: v2FactoryAbi, functionName: "getLaunchFeePolicy", args: [address] }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "realQuoteReserve" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "sellableTokens" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "feeBps" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "creatorTaxBps" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "readyToGraduate" }),
          client.readContract({ address: v2.curve, abi: v2CurveAbi, functionName: "graduated" }),
          client
            .readContract({
              address: v2.curve,
              abi: v2CurveAbi,
              functionName: "currentSnipeTaxBps",
              args: [ZERO_ADDRESS],
            })
            .catch(() => 0n),
        ]);

      return {
        generation: "v2",
        launch: v2,
        meta: asMeta(info as readonly unknown[], name, symbol),
        quoteReserve: curveState[0],
        tokenReserve: curveState[1],
        realQuote,
        sellable,
        feeBps,
        creatorTaxBps,
        readyToGraduate: ready,
        graduated,
        snipeBps: snipe,
        policy,
        progress: graduationProgress(realQuote, v2.graduationThreshold),
        phase: v2.phase as GraduationPhase,
        pairDecimals: pairDecimals(v2.pairToken),
      };
    }

    const v1 = (await client.readContract({
      address: V1_FACTORY,
      abi: v1FactoryAbi,
      functionName: "getLaunchedToken",
      args: [address],
    })) as V1Launch;

    if (!v1.exists) {
      throw new Error("Token is not a Pons launch");
    }

    const [info, name, symbol, graduation] = await Promise.all([
      client.readContract({ address, abi: v1TokenAbi, functionName: "getTokenInfo" }),
      client.readContract({ address, abi: v1TokenAbi, functionName: "name" }),
      client.readContract({ address, abi: v1TokenAbi, functionName: "symbol" }),
      client.readContract({
        address: V1_FACTORY,
        abi: v1FactoryAbi,
        functionName: "graduationStatus",
        args: [address],
      }) as Promise<readonly [bigint, bigint, boolean]>,
    ]);

    return {
      generation: "v1",
      launch: v1,
      meta: asMeta(info as readonly unknown[], name, symbol),
      quoteReserve: 0n,
      tokenReserve: 0n,
      realQuote: graduation[0],
      sellable: 0n,
      feeBps: 0n,
      creatorTaxBps: 0n,
      readyToGraduate: graduation[2],
      graduated: graduation[2],
      snipeBps: 0n,
      policy: null,
      progress: graduationProgress(graduation[0], graduation[1]),
      phase: (graduation[2] ? 2 : 0) as GraduationPhase,
      pairDecimals: 18,
      threshold: graduation[1],
    };
  });
}
