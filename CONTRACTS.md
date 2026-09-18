# Pons contract map

This document describes every launch-related contract in this repository, how they connect, and the **live Robinhood Chain** addresses the frontend must use. Solidity sources are not modified. Addresses are not changed.

Network: **Robinhood Chain** (chain id `4663`)  
RPC: `https://rpc.mainnet.chain.robinhood.com`  
Explorer: `https://robinhoodchain.blockscout.com`  
Native gas token: ETH

---

## How the two generations relate

```
Creator wallet
      │
      ├──────── V1 ────────► PonsLaunchFactory
      │                         │ CREATE2
      │                         ▼
      │                   PonsLauncherToken
      │                         │
      │                         ▼
      │              Uniswap V3 pool + locked NFT
      │                         │
      │                         ▼
      │                   Pons launch locker
      │
      └──────── V2 ────────► PonsV2LaunchFactory
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
           PonsV2LaunchDeployer      PonsV2LaunchAndBuy (optional router)
                    │
          CREATE2 curve + token
                    │
                    ▼
           PonsV2BondingCurve  ←→  PonsV2LauncherToken
                    │
                    │  graduate() then createGraduatedPool()
                    ▼
           PonsV2GraduationGuard (preflight)
           PonsV2GraduationExecutor (V4 mint)
                    │
                    ▼
           Uniswap V4 pool + PonsV2MemeHook
                    │
                    ├─► PonsV2LaunchLocker (position NFT + leftover supply)
                    ├─► PonsV2FeeEscrow (claimable fees)
                    └─► PonsV2BuybackVault (5-year vest)
```

V1 and V2 are **both live**. They do not share a factory. A token belongs to exactly one generation. Resolve it from the factory that emitted `TokenLaunched`.

---

## Live addresses (Robinhood Chain)

Verified against on-chain getters on 2026-09-18. Do not replace these.

### V1

| Role | Contract | Address |
| --- | --- | --- |
| Factory (entry point) | `PonsLaunchFactory` | `0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB` |
| Position locker | V1 locker (immutable on factory) | `0x736d76699c26d0d966744cae304c000d471f7f35` |
| Uniswap V3 factory (DEX config 0) | Uniswap V3 | `0x1f7d7550b1b028f7571e69a784071f0205fd2efa` |
| V3 NonfungiblePositionManager | Uniswap V3 | `0x73991a25c818bf1f1128deaab1492d45638de0d3` |
| V3 SwapRouter | Uniswap V3 / SwapRouter02 | `0xcaf681a66d020601342297493863e78c959e5cb2` |
| Default pair token (launch config 0) | WETH-like quote | `0x0bd7d308f8e1639fab988df18a8011f41eacad73` |

Root files `abi.json` and `contract-meta.json` describe this exact V1 factory deployment.

### V2

| Role | Contract | Address |
| --- | --- | --- |
| Factory (entry point) | `PonsV2LaunchFactory` | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` |
| Launch + buy router | `PonsV2LaunchAndBuy` (`launchForwarder`) | `0xe33E9E479dF8802cb0866d5d05258bEc4cF62948` |
| Curve/token deployer | `PonsV2LaunchDeployer` | `0x3711ceA4feaDE896C913C68F01Eda97Cb06D1A42` |
| Meme hook / fee policy | `PonsV2MemeHook` | `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` |
| Fee escrow | `IPonsV2FeeEscrow` | `0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e` |
| Buyback vault | `PonsV2BuybackVault` | `0x42df2a798f82289E177311362e8f5ccC45c1219c` |
| Launch locker | `PonsV2LaunchLocker` | `0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952` |
| Graduation executor | `PonsV2GraduationExecutor` | `0xC7819B64A1dAECD7eC19856d026cb14EfBd89046` |
| Graduation guard | `PonsV2GraduationGuard` | `0xf5695117b99B6f6401e67d4195BD653628176C6C` |
| Uniswap V4 PoolManager | chain singleton | `0x8366a39cc670b4001a1121b8f6a443a643e40951` |
| Uniswap V4 PositionManager | chain singleton | `0x58daec3116aae6d93017baaea7749052e8a04fa7` |
| Permit2 | canonical | `0x000000000022d473030f116ddee9f6b43ac78ba3` |

Per-launch contracts (`PonsV2BondingCurve`, `PonsV2LauncherToken`) are created at launch. Always read them from `getLaunchedToken(token)`.

---

## V1 — CREATE2 factory + locked Uniswap V3

Sources: `contractsV1/src/`

### `PonsLaunchFactory`

Frontend entry point for V1.

- Owner-managed DEX profiles (`getDexConfig`) and launch presets (`getLaunchConfig`).
- `launchToken(TokenParams, launchConfigId, dexId, salt)` deploys the ERC-20 via CREATE2, initializes a V3 pool, mints a one-sided position, locks the NFT, and optionally spends `msg.value - launchFee` as an atomic first buy.
- Token addresses are forced to end in `bbbb`. Pass any salt; the factory searches for a vanity suffix on-chain. `predictVanityTokenAddress` previews the result.
- `graduationStatus(token)` compares locked paired-token principal to the stored threshold.

Live config 0 (read on-chain):

| Field | Value |
| --- | --- |
| Pair token | `0x0bd7d308f8e1639fab988df18a8011f41eacad73` |
| Graduation threshold | `4.2` quote units |
| Initial tick | `-204200` |
| Supply | `1_000_000_000` (18 decimals) |
| Max wallet / max tx | `500` / `550` bps |
| Restriction blocks | `2` |
| Pool fee / tick spacing | `10000` / `200` |
| Launch fee | `0.0005 ETH` |
| Public launches | currently **closed** (`launchEnabled = false`); whitelist still works |

### `PonsLauncherToken`

Fixed-supply ERC-20 minted entirely to the factory, then deposited as V3 liquidity.

- On-chain metadata: `logo`, `description`, `socials()`, `getTokenInfo()`.
- Anti-snipe during `restrictionBlocks`: same-block buy block, max wallet, cumulative pool-buy cap.
- `liquidityPool()` returns the canonical V3 pool.

### `ILaunchpad.sol`

Thin Uniswap V3 + locker surfaces used by the factory. Not deployed.

### Libraries

- `PonsLiquidityMath.sol` — amounts for a concentrated range.
- `PonsTickMath.sol` — Uniswap V3 tick math (GPL-2.0-or-later).

### V1 locker

Receives every launch position NFT. Routes protocol fees and optional creator fee redirects. Address is `factory.locker()`.

---

## V2 — bonding curve + graduated Uniswap V4

Sources: `contractsV2/src/v2/`

### `PonsV2LaunchFactory`

Frontend entry point for V2.

Launch:

```
launchToken(TokenParams, launchConfigId, pairToken)
launchToken(TokenParams, launchConfigId, pairToken, snipeTaxExemptions)
launchTokenFor(...)  // only the trusted launchForwarder (router)
```

`TokenParams` includes name/symbol/logo/description/socials, `creatorFeeRecipient`, `creatorTaxBps`, `buybackEnabled`, `expectedEconomics`, and `salt`.

Pin economics immediately before sending:

```
expectedEconomics = previewLaunchEconomics(launchConfigId, pairToken)
```

`pairToken = address(0)` is native ETH. Any other address must pass `approvedPairTokens`.

Live config 0:

| Field | Value |
| --- | --- |
| Supply | `1_000_000_000` (18 decimals) |
| Curve fee | `100` bps |
| Phantom quote (ETH) | `1.68 ETH` |
| Graduation threshold (ETH) | `4.2 ETH` |
| Pool fee | `0` (hook takes fees) |
| Tick spacing | `200` |
| Launch fee | `0.0005 ETH` |
| Public launches | **open** (`launchEnabled = true`) |
| Max creator tax | `1000` bps |
| Snipe tax start / window | `9900` bps decaying over `3` seconds |

Graduation is two permissionless phases:

1. `graduate(token)` — drains the curve into the factory (`NotGraduated` → `Swept`). Usually triggered automatically by the crossing buy.
2. `createGraduatedPool(token)` — seeds the V4 pool and locks the position (`Swept` → `PoolCreated`). Retryable.

Phases: `0 NotGraduated`, `1 Swept`, `2 PoolCreated`, `3 Rescued`.

### `PonsV2LaunchDeployer`

Deploys the curve + token pair so the factory stays under EIP-170. Metadata length caps: name 64, symbol 16, logo 512, description 2048, each social 256. `predictLaunchAddresses` (live ABI) previews CREATE2 addresses from salt + constructor args.

### `PonsV2LaunchAndBuy`

Optional router at `launchForwarder`. One transaction: create the launch, then buy. Native: `msg.value = launchFee + quoteIn`. ERC-20 pair: send only the fee and approve the router for `quoteIn`.

```
launchAndBuy(params, launchConfigId, pairToken, quoteIn, minTokensOut, recipient, snipeTaxExemptions)
```

`creatorFeeRecipient` must be non-zero on this path.

### `PonsV2BondingCurve`

One per launch. Constant-product curve quoted in the future pool asset.

| Call | Purpose |
| --- | --- |
| `buy(quoteIn, minTokensOut, recipient)` | Buy (native: `msg.value == quoteIn`) |
| `sell(tokensIn, minQuoteOut, recipient)` | Sell (approve the curve first) |
| `getReserves()` | Pricing reserves (includes phantom quote) |
| `realQuoteReserve()` | Quote actually collected |
| `sellableTokens()` | Remaining buyable supply |
| `readyToGraduate()` / `graduated()` | Lifecycle |
| `currentSnipeTaxBps(recipient)` | Opening-tax quote (live ABI) |
| `feeBps()` / `creatorTaxBps()` | Trade cost |

There is no on-chain quote function. Reproduce curve math off-chain (see `PonsV2BondingCurveMath` and official v2 docs).

### `PonsV2LauncherToken`

Fixed-supply ERC-20 minted entirely to its curve. `deployer` is metadata only. Same `getTokenInfo()` / `socials()` shape as V1.

### `PonsV2GraduationGuard`

Stateless preflight so a curve is never drained into an unseedable V4 position.

### `PonsV2GraduationExecutor`

Encodes Permit2 + PositionManager mint of the full-range position into the locker.

### `PonsV2LaunchLocker`

Permanently holds the graduated V4 position NFT and any leftover supply. No withdraw path.

### `PonsV2MemeHook`

Singleton Uniswap V4 hook on every graduated pool. Also the live `IPonsV2FeePolicy` (`currentFeePolicy()`). Snapshotted per launch via `getLaunchFeePolicy(token)`.

### `PonsV2FeeEscrow`

Claimable protocol/creator balances in ETH and ERC-20. `claim()` / `claimToken(token)`.

### `PonsV2BuybackVault`

Five-year linear vest of bought-back supply. `release(token)` pays creator and protocol.

### Libraries

- `PonsV2BondingCurveMath.sol` — constant-product `getAmountOut` / `getAmountIn`.
- `PonsV2GraduationMath.sol` — V4 seed sqrt-price from amounts.

### Interfaces

- `interfaces/ILaunchpadV2.sol` — escrow, fee policy, factory record, `GraduationPhase`.
- `interfaces/ILaunchpadV2Graduation.sol` — curve → factory `graduate` callback.

---

## Quote assets (V2)

Native ETH is always valid (`pairToken = 0x000…000`). ERC-20 quotes are owner-approved. The frontend must call `approvedPairTokens` and `pairTokenEconomics` rather than assuming this list is frozen.

Known approved pair tokens (ecosystem):

| Symbol | Address | Decimals |
| --- | --- | --- |
| ETH | `0x0000000000000000000000000000000000000000` | 18 |
| USDG | `0x5fc5360d0400a0fd4f2af552add042d716f1d168` | 6 |
| AAPL | `0xaf3d76f1834a1d425780943c99ea8a608f8a93f9` | 18 |
| AMD | `0x86923f96303d656e4aa86d9d42d1e57ad2023fdc` | 18 |
| AMZN | `0x12f190a9f9d7d37a250758b26824b97ce941bf54` | 18 |
| COIN | `0x6330d8c3178a418788df01a47479c0ce7ccf450b` | 18 |
| CRCL | `0xdf0992e440dd0be65bd8439b609d6d4366bf1cb5` | 18 |
| GME | `0x1b0e319c6a659f002271b69db8a7df2f911c153e` | 18 |
| GOOGL | `0x2e0847e8910a9732eb3fb1bb4b70a580adad4fe3` | 18 |
| META | `0xc0d6457c16cc70d6790dd43521c899c87ce02f35` | 18 |
| MSFT | `0xe93237c50d904957cf27e7b1133b510c669c2e74` | 18 |
| MU | `0xff080c8ce2e5feadaca0da81314ae59d232d4afd` | 18 |
| NVDA | `0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec` | 18 |
| PLTR | `0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a` | 18 |
| SNDK | `0xb90a19ff0af67f7779aff50a882a9cff42446400` | 18 |
| SPCX | `0x4a0e65a3eccec6dbe60ae065f2e7bb85fae35eea` | 18 |
| SPY | `0x117cc2133c37b721f49de2a7a74833232b3b4c0c` | 18 |
| TSLA | `0x322f0929c4625ed5bad873c95208d54e1c003b2d` | 18 |

---

## Indexing events

There is no official Pons API in the trust path. Index factory logs.

### V1 factory `0xA5aA…1feB`

| Event | Use |
| --- | --- |
| `TokenDeployed(token, deployer, dexFactory, pairToken, dexId, launchConfigId)` | Address known before pool lock finishes |
| `TokenLaunched(token, deployer, dexFactory, pairToken, pool, dexId, launchConfigId, positionId, restrictionsEndBlock, initialBuyAmount)` | Canonical launch record |

### V2 factory `0x7eD5…EC7e`

| Event | Use |
| --- | --- |
| `TokenLaunched(token, curve, deployer, pairToken, launchConfigId, graduationThreshold)` | New launch |
| `LaunchSwept(token, quoteOut, tokenOut)` | Phase → Swept |
| `PoolGraduated(token, positionId, tokenAmount, pairTokenAmount)` | Phase → PoolCreated |

### V2 curve (one per token)

| Event | Use |
| --- | --- |
| `CurveBuy` / `CurveSell` | Trade history |
| `CurveBuyRefunded` | Partial fill near graduation |
| `CurveCompleted` | Curve drained |
| `AutoGraduationFailed` | Needs `createGraduatedPool` |

---

## Pons Doorway (not a launch contract)

`contractsV2/src/v2/testing/PonsDoorway.sol` is a **reference** Solana ↔ Robinhood liquidity-migration sketch. It is not wired to the factories and is not used by token creation. Reference testing token mentioned in `doorway.md`: `0xde1ecd746f7922300ca3cab0e8525eec3a16d6e9`.

---

## Frontend binding rules

1. Never redeploy or edit Solidity.
2. Read ABIs from this repo (`abi.json` for V1 factory; V2 ABIs derived from `contractsV2/src/v2`).
3. Read addresses from this file / `frontend/src/lib/contracts/addresses.ts`.
4. Discover DEX/launch configs, fees, and pair-token approval **on-chain** at runtime.
5. Store token `logo` as an IPFS URI (metadata.json recommended; image CID inside that JSON).
6. V2 create flow: `previewLaunchEconomics` → random `salt` → `launchToken` or `launchAndBuy`.
7. V1 create flow: `launchToken` with extra native value for the optional seed buy.
8. Route trades by phase: curve while `phase == 0`; Uniswap V4 after `phase == 2`; Uniswap V3 for all V1 tokens.
