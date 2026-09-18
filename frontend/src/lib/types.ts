import type { Address, Hash } from "viem";

export type Generation = "v1" | "v2";

export type GraduationPhase = 0 | 1 | 2 | 3;

export type Socials = {
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
  farcaster: string;
};

export type LaunchRecord = {
  generation: Generation;
  token: Address;
  curve?: Address;
  deployer: Address;
  pairToken: Address;
  launchConfigId: bigint;
  graduationThreshold?: bigint;
  pool?: Address;
  dexFactory?: Address;
  blockNumber: bigint;
  txHash: Hash;
};

export type TokenMeta = {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  socials: Socials;
};

export const PHASE_LABEL: Record<GraduationPhase, string> = {
  0: "Bonding",
  1: "Swept",
  2: "Graduated",
  3: "Rescued",
};

export type V2Launch = {
  token: Address;
  curve: Address;
  deployer: Address;
  creatorFeeRecipient: Address;
  pairToken: Address;
  graduationThreshold: bigint;
  poolFee: number;
  tickSpacing: number;
  creatorTaxBps: number;
  buybackEnabled: boolean;
  phase: number;
  sweptQuote: bigint;
  sweptTokens: bigint;
  sweptAt: bigint;
  exists: boolean;
};

export type V1Launch = {
  token: Address;
  deployer: Address;
  pairedToken: Address;
  positionManager: Address;
  positionId: bigint;
  dexId: bigint;
  launchConfigId: bigint;
  restrictionsEndBlock: bigint;
  supply: bigint;
  isToken0: boolean;
  poolFee: number;
  exists: boolean;
  initialBuyAmount: bigint;
};

export const emptySocials: Socials = {
  twitter: "",
  telegram: "",
  discord: "",
  website: "",
  farcaster: "",
};
