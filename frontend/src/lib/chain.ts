import { robinhood as robinhoodChain } from "viem/chains";

export const robinhood = robinhoodChain;
export const ROBINHOOD_CHAIN_ID = robinhoodChain.id;

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
