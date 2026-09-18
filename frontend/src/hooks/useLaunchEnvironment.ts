"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { V1_FACTORY, V2_FACTORY, ZERO_ADDRESS, KNOWN_PAIR_TOKENS } from "@/lib/contracts/addresses";
import { v1FactoryAbi, v2FactoryAbi } from "@/lib/contracts/abis";
import type { Address } from "viem";

export function useLaunchEnvironment() {
  const client = usePublicClient();

  return useQuery({
    queryKey: ["launch-env"],
    enabled: Boolean(client),
    staleTime: 30_000,
    queryFn: async () => {
      if (!client) throw new Error("No client");
      const [
        v2Fee,
        v2Enabled,
        v2Count,
        v2MaxTax,
        v1Fee,
        v1Enabled,
        v1Count,
        v1DexCount,
      ] = await Promise.all([
        client.readContract({ address: V2_FACTORY, abi: v2FactoryAbi, functionName: "launchFee" }),
        client.readContract({ address: V2_FACTORY, abi: v2FactoryAbi, functionName: "launchEnabled" }),
        client.readContract({ address: V2_FACTORY, abi: v2FactoryAbi, functionName: "launchConfigCount" }),
        client.readContract({ address: V2_FACTORY, abi: v2FactoryAbi, functionName: "maxCreatorTaxBps" }),
        client.readContract({ address: V1_FACTORY, abi: v1FactoryAbi, functionName: "launchFee" }),
        client.readContract({ address: V1_FACTORY, abi: v1FactoryAbi, functionName: "launchEnabled" }),
        client.readContract({ address: V1_FACTORY, abi: v1FactoryAbi, functionName: "launchConfigCount" }),
        client.readContract({ address: V1_FACTORY, abi: v1FactoryAbi, functionName: "dexConfigCount" }),
      ]);

      const v2Configs = await Promise.all(
        Array.from({ length: Number(v2Count) }, (_, id) =>
          client.readContract({
            address: V2_FACTORY,
            abi: v2FactoryAbi,
            functionName: "getLaunchConfig",
            args: [BigInt(id)],
          }).then((config) => ({ id: BigInt(id), ...config })),
        ),
      );

      const v1Configs = await Promise.all(
        Array.from({ length: Number(v1Count) }, async (_, id) => {
          const config = (await client.readContract({
            address: V1_FACTORY,
            abi: v1FactoryAbi,
            functionName: "getLaunchConfig",
            args: [BigInt(id)],
          })) as {
            pairToken: Address;
            graduationThreshold: bigint;
            initialTick: number;
            supply: bigint;
            maxWalletBps: number;
            maxTxBps: number;
            restrictionBlocks: number;
            reservedFee: number;
            enabled: boolean;
            routerRequiresDeadline: boolean;
          };
          return { id: BigInt(id), ...config };
        }),
      );

      const v1Dex = await Promise.all(
        Array.from({ length: Number(v1DexCount) }, async (_, id) => {
          const config = (await client.readContract({
            address: V1_FACTORY,
            abi: v1FactoryAbi,
            functionName: "getDexConfig",
            args: [BigInt(id)],
          })) as {
            name: string;
            factory: Address;
            positionManager: Address;
            swapRouter: Address;
            poolFee: number;
            tickSpacing: number;
            enabled: boolean;
          };
          return { id: BigInt(id), ...config };
        }),
      );

      const pairs = await Promise.all(
        KNOWN_PAIR_TOKENS.map(async (token) => {
          if (token.address === ZERO_ADDRESS) {
            return { ...token, approved: true, phantomQuote: 0n, graduationThreshold: 0n };
          }
          const [approved, economics] = await Promise.all([
            client.readContract({
              address: V2_FACTORY,
              abi: v2FactoryAbi,
              functionName: "approvedPairTokens",
              args: [token.address],
            }),
            client.readContract({
              address: V2_FACTORY,
              abi: v2FactoryAbi,
              functionName: "pairTokenEconomics",
              args: [token.address],
            }),
          ]);
          return {
            ...token,
            approved,
            phantomQuote: economics[0],
            graduationThreshold: economics[1],
            decimals: Number(economics[2]) || token.decimals,
          };
        }),
      );

      return {
        v2: {
          launchFee: v2Fee as bigint,
          launchEnabled: Boolean(v2Enabled),
          maxCreatorTaxBps: v2MaxTax as bigint,
          configs: v2Configs.filter((c) => c.enabled),
          allConfigs: v2Configs,
        },
        v1: {
          launchFee: v1Fee as bigint,
          launchEnabled: Boolean(v1Enabled),
          configs: v1Configs.filter((c) => c.enabled),
          allConfigs: v1Configs,
          dex: v1Dex.filter((d) => d.enabled),
        },
        pairs: pairs.filter((p) => p.approved && (p.address === ZERO_ADDRESS || p.phantomQuote > 0n)),
      };
    },
  });
}
