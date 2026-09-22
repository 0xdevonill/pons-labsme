import { parseEther, isAddress, type Address } from "viem";
import { ZERO_ADDRESS } from "./contracts/addresses";

export const APP_NAME = "Fons";
export const APP_TICKER = "FONS";
export const APP_TAGLINE = "Launch and explore tokens on Robinhood Chain";
export const APP_DESCRIPTION =
  "Launch and explore fixed-supply tokens on Robinhood Chain. Pair against ETH, USDG, or tokenized stocks. Your wallet submits every transaction.";

export const CONTACT = {
  email: "contact@fonsfamily.com",
  website: "https://fonsfamily.com",
  websiteLabel: "fonsfamily.com",
  twitter: "https://x.com/fonsdotfamily",
  twitterHandle: "@fonsdotfamily",
} as const;

export const THEME_STORAGE_KEY = "fons-theme";

/** Fons platform fee charged on every create, in ETH. */
export const PLATFORM_FEE_ETH = "0.005";
export const PLATFORM_FEE = parseEther(PLATFORM_FEE_ETH);

export const FONS_FEE_RECIPIENT = (
  process.env.NEXT_PUBLIC_FONS_FEE_RECIPIENT && isAddress(process.env.NEXT_PUBLIC_FONS_FEE_RECIPIENT)
    ? process.env.NEXT_PUBLIC_FONS_FEE_RECIPIENT
    : ZERO_ADDRESS
) as Address;

export const FONS_TOKEN_ADDRESS = (
  process.env.NEXT_PUBLIC_FONS_TOKEN && isAddress(process.env.NEXT_PUBLIC_FONS_TOKEN)
    ? process.env.NEXT_PUBLIC_FONS_TOKEN
    : ""
) as Address | "";

export const PINNED_TOKEN = {
  name: "Fons",
  symbol: "FONS",
  description: "The Fons platform token. It stays pinned at the top of the market. Add the contract address after launch.",
  logo: "/logo.png",
};
