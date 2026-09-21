# Helix frontend

Production frontend for the live **Pons V1 & V2** contracts on Robinhood Chain. The product name is **Helix**. Solidity in this repository is not modified, replaced, or redeployed. Pons contact and contract addresses stay the same.

Stack: **Next.js 15 · TypeScript · Tailwind CSS · Wagmi · Viem**

## Features

- Robinhood Network wallet connection (injected / Robinhood Wallet / WalletConnect)
- Create Token (V2 bonding curve or V1 Uniswap V3)
- PNG, GIF, animated WebP, JPG uploads — animation is preserved
- Automatic IPFS pin + generated `metadata.json`
- Metadata URI written to the on-chain `logo` field
- Pons Market-style creator commission (V2 creator tax, capped on-chain)
- Contained token logos that do not overflow cards
- Token preview before launch
- Explore + search/filter
- My Tokens
- Bonding curve progress and graduation status
- Curve trade panel + transaction history
- Dark / light UI
- English-only interface
- Contact: [contact@ponsfamily.com](mailto:contact@ponsfamily.com) · [ponsfamily.com](https://ponsfamily.com) · [@ponsdotfamily](https://x.com/ponsdotfamily)

## Local development

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_RPC_URL` | no | Defaults to `https://rpc.mainnet.chain.robinhood.com` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | Enables WalletConnect QR |
| `NEXT_PUBLIC_LOG_LOOKBACK` | no | Block window for event indexing (default `100000`) |
| `PINATA_JWT` | **yes for launches** | Server-side IPFS pinning via Pinata |

Create a Pinata JWT at [pinata.cloud](https://pinata.cloud) and set `PINATA_JWT`. Without it, token creation cannot upload media.

## Vercel

1. Set the project root to `frontend` (or import the repo and choose that folder).
2. Framework preset: Next.js.
3. Add `PINATA_JWT` (and optionally WalletConnect + RPC) in Project Settings → Environment Variables.
4. Deploy. No contract addresses or Solidity changes are required.

`vercel.json` is included. The app uses the factories documented in [`../CONTRACTS.md`](../CONTRACTS.md):

- V1 `PonsLaunchFactory` `0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB`
- V2 `PonsV2LaunchFactory` `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`

Configs, fees, pair-token approvals, and DEX profiles are read on-chain at runtime.

## Compatibility notes

- V2 `launchToken` pins economics with `previewLaunchEconomics`.
- Optional first buy uses `PonsV2LaunchAndBuy` (`launchAndBuy`).
- V1 public launches may be gated (`launchEnabled`). The UI still targets the live factory.
- Graduated V2 tokens trade on Uniswap V4 via `PonsV2MemeHook`; the curve panel closes after graduation.
- Creator commission is `creatorTaxBps` on the live factory, capped by `maxCreatorTaxBps()`.
