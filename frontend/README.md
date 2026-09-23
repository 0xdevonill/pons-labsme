# Fons frontend

Production frontend for the live **Fons** launchpad on Robinhood Chain. The product name is **Fons**. Solidity in this repository is not modified, replaced, or redeployed.

The UI uses the glass **F** mark, lime create/connect actions, stock quote assets, and a pinned Fons card at the top of the market.

## Run

```bash
npm install
npm run dev
```

- Live V1 + V2 factories on Robinhood Chain
- IPFS metadata + image/GIF upload through Pinata
- Creator commission slider (0–10%)
- Pinned Fons token on the first market page (`NEXT_PUBLIC_FONS_TOKEN`)

## Environment

Copy `.env.example` and fill:

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_RPC_URL` | Robinhood Chain RPC |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project |
| `PINATA_JWT` | Server-only JWT for `/api/ipfs` and `/api/media` |
| `NEXT_PUBLIC_LOG_LOOKBACK` | How far back the indexer reads factory logs |
| `NEXT_PUBLIC_FONS_TOKEN` | Contract address of the Fons token (`0x43873E24CDeF7724F8F2f524C3aeECaAAe4FcC8A`) |
| `NEXT_PUBLIC_FONS_FEE_RECIPIENT` | Wallet that receives the extra platform fee above the on-chain factory fee |
