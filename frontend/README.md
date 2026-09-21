# Fons frontend

Production frontend for the live **Pons V1 & V2** contracts on Robinhood Chain. The product name is **Fons**. Solidity in this repository is not modified, replaced, or redeployed.

The UI follows the official [ponsfamily.com/launchpad](https://www.ponsfamily.com/launchpad) layout: glass **F** mark, lime create/connect actions, stock quote assets, and a pinned Fons card at the top of the market.

## Features

- Launch against ETH, USDG, cbBTC, or tokenized stocks (NVDA, TSLA, AAPL, and other approved pairs)
- GIF / animated WebP / PNG / JPG art
- Creator commission (V2 creator tax)
- Platform fee **0.005 ETH** per create
- Pinned Fons token on the first market page (`NEXT_PUBLIC_FONS_TOKEN` once launched)
- Explore, profile, activity, bonding-curve trade panel

## Environment

| Variable | Purpose |
| --- | --- |
| `PINATA_JWT` | Required to pin launch art |
| `NEXT_PUBLIC_FONS_TOKEN` | Contract address of the Fons token, once created |
| `NEXT_PUBLIC_FONS_FEE_RECIPIENT` | Wallet that receives the extra platform fee above the on-chain factory fee |

## Local development

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
