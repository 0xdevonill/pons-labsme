<p align="center">
  <img src="./dividends.jpg" alt="PonsDividends" width="180">
</p>

<h1 align="center">Pons V2 — PonsDividends</h1>

<p align="center">
  <strong>Experimental Automated Treasury, Trading & Buyback Infrastructure</strong>
</p>

<p align="center">
  <code>FEES → TREASURY → AGENT → TRADE → PNL → BUYBACK → $PONS</code>
</p>

<p align="center">
  <a href="#-overview">Overview</a> ·
  <a href="#-the-test-asset">Test Asset</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-execution-engine">Execution</a> ·
  <a href="#-buyback-engine">Buybacks</a> ·
  <a href="#-security-model">Security</a>
</p>

<br>

> [!NOTE]
> **PonsDividends Agent Wallet**
>
> The designated **Agent Wallet** for the PonsDividends experimental infrastructure is:
>
> `0x00000517049d4A6EBE08C35C96d2895091883046`
>
> This wallet serves as the operational wallet for the **Agent layer**, acting as the execution point for authorized market operations within the PonsDividends architecture.
>
> The Agent Wallet is **not the treasury itself**. It is the execution component between the treasury's allocated capital and the market, operating within the permissions, limits and risk controls defined by the system.

<br>

<p align="center">
  <img src="./dividends.jpg" alt="PonsDividends overview" width="900">
</p>

> [!CAUTION]
> **Experimental / Test Infrastructure**
>
> PonsDividends is an experimental prototype designed to explain and test an automated fee-funded treasury mechanism.
>
> The system is **not financial advice**, is **not an investment product**, does **not guarantee profits**.
>
> The asset used throughout this prototype is **`$DIVIDENDS`**, a dedicated **test asset** created to demonstrate the mechanism.

<details>
<summary><strong>Table of Contents</strong></summary>

* [01 — Overview](#01--overview)
* [02 — The Test Asset](#02--the-test-asset)
* [03 — Design Objective](#03--design-objective)
* [04 — Core Architecture](#04--core-architecture)
* [05 — The Economic Machine](#05--the-economic-machine)
* [06 — Fee Flow](#06--fee-flow)
* [07 — Treasury Architecture](#07--treasury-architecture)
* [08 — Automated Agent](#08--automated-agent)
* [09 — Asset Universe](#09--asset-universe)
* [10 — Strategy Layer](#10--strategy-layer)
* [11 — Risk Engine](#11--risk-engine)
* [12 — Execution Engine](#12--execution-engine)
* [13 — Portfolio Accounting](#13--portfolio-accounting)
* [14 — PnL Accounting](#14--pnl-accounting)
* [15 — Buyback Engine](#15--buyback-engine)
* [16 — Strategic Buybacks](#16--strategic-buybacks)
* [17 — The Buyback Decision](#17--the-buyback-decision)
* [18 — Complete Execution Cycle](#18--complete-execution-cycle)
* [19 — Agent Permissions](#19--agent-permissions)
* [20 — Failure & Emergency States](#20--failure--emergency-states)
* [21 — On-Chain / Off-Chain Boundary](#21--on-chain--off-chain-boundary)
* [22 — Accounting Invariants](#22--accounting-invariants)
* [23 — Testing Model](#23--testing-model)
* [24 — Example Scenario](#24--example-scenario)
* [25 — Current vs Future](#25--current-vs-future)
* [26 — Repository Structure](#26--repository-structure)
* [27 — Design Principles](#27--design-principles)
* [28 — What This Prototype Does Not Do](#28--what-this-prototype-does-not-do)
* [29 — Final Architecture](#29--final-architecture)
* [30 — Summary](#30--summary)

</details>

---

# 01 — Overview

**PonsDividends** is an experimental treasury mechanism being developed around the Pons ecosystem.

The prototype explores a simple question:

> **Can protocol-generated fees be transformed into an autonomous treasury that deploys controlled capital into market operations and uses eligible realized capital for strategic `$PONS` buybacks?**

The architecture separates the system into distinct layers:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         PONSDIVIDENDS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   FEE LAYER          TREASURY          AGENT          BUYBACK        │
│                                                                     │
│   Protocol fees  →   Capital      →   Market     →   $PONS          │
│                      allocation       operations     acquisition    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The resulting economic loop is:

```text
                         ┌───────────────────┐
                         │   PONS ACTIVITY   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │       FEES        │
                         └─────────┬─────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │     PONSDIVIDENDS TREASURY  │
                    └──────────────┬──────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
              TRADING CAPITAL              RESERVE / BUYBACK
                     │                           │
                     ▼                           │
              AUTOMATED AGENT                   │
                     │                           │
                     ▼                           │
              MARKET OPERATIONS                 │
                     │                           │
                     ▼                           │
                 REALIZED PNL                    │
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
                           BUYBACK ENGINE
                                   │
                                   ▼
                                $PONS
```

PonsDividends is therefore **not a conventional dividend contract**.

The name describes the intended economic concept: protocol-generated revenue is redirected into an automated mechanism designed to return part of the resulting economic value to the ecosystem through `$PONS` buybacks.

---

# 02 — The Test Asset

<p align="center">
  <img src="./assets/dividends-token.png" alt="$DIVIDENDS test asset" width="220">
</p>

## `PonsDividends — $DIVIDENDS`

The entire prototype is documented around a dedicated testing asset:

```text
┌─────────────────────────────────────────────┐
│                                             │
│              PONSDIVIDENDS                  │
│                                             │
│                 $DIVIDENDS                  │
│                                             │
│          EXPERIMENTAL TEST ASSET             │
│                                             │
└─────────────────────────────────────────────┘
```

**`$DIVIDENDS` is a test asset.**

It exists specifically to demonstrate the PonsDividends mechanism and provide a controlled reference asset for development, testing, simulations and protocol demonstrations.

It should not be interpreted as:

* a production Pons token;
* a guaranteed dividend instrument;
* a representation of future returns;
* an investment recommendation;
* a promise of buyback activity;
* a representation of production treasury performance.

### Why use a dedicated test asset?

The prototype needs an isolated asset through which the full mechanism can be demonstrated without confusing experimental infrastructure with production economics.

The intended development sequence is:

```text
                 TEST ENVIRONMENT
                       │
                       ▼
                $DIVIDENDS
                       │
                       ▼
              TEST FEE GENERATION
                       │
                       ▼
                  TREASURY
                       │
                       ▼
                 AGENT LOGIC
                       │
                       ▼
                 PnL ACCOUNTING
                       │
                       ▼
              BUYBACK SIMULATION
                       │
                       ▼
                 $PONS TARGET
```

The **test asset is the reference implementation for the mechanism**.

---

# 03 — Design Objective

PonsDividends is designed around five fundamental operations:

```text
          ① COLLECT
              │
              ▼
          ② ALLOCATE
              │
              ▼
          ③ DEPLOY
              │
              ▼
          ④ ACCOUNT
              │
              ▼
          ⑤ BUY BACK
```

Expanded:

```text
FEES
 │
 ├──────────────► RESERVE
 │
 └──────────────► TRADING CAPITAL
                         │
                         ▼
                  AUTOMATED AGENT
                         │
                         ▼
                 MARKET OPERATIONS
                         │
                         ▼
                     NET PNL
                         │
                         ▼
                 BUYBACK ELIGIBILITY
                         │
                         ▼
                      $PONS
```

The system deliberately does **not** assume:

```text
fees → immediate buyback
```

Instead:

```text
fees
 ↓
treasury
 ↓
risk-controlled deployment
 ↓
actual realized performance
 ↓
buyback decision
```

This distinction is the foundation of the prototype.

---

# 04 — Core Architecture

PonsDividends is divided into six conceptual layers.

```text
┌──────────────────────────────────────────────────────────────┐
│                    PONSDIVIDENDS STACK                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 06     BUYBACK EXECUTOR                              │
│                    ▲                                         │
│  LAYER 05     PROFIT / PNL ACCOUNTING                       │
│                    ▲                                         │
│  LAYER 04     EXECUTION + RISK                              │
│                    ▲                                         │
│  LAYER 03     AUTOMATED STRATEGY AGENT                      │
│                    ▲                                         │
│  LAYER 02     TREASURY / CAPITAL ALLOCATION                 │
│                    ▲                                         │
│  LAYER 01     PONS FEE INPUT                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Each layer has a defined responsibility.

| Layer            | Responsibility                                   |
| ---------------- | ------------------------------------------------ |
| Fee Input        | Receives eligible protocol-generated revenue     |
| Treasury         | Holds and allocates capital                      |
| Agent            | Evaluates market opportunities                   |
| Risk / Execution | Constrains and executes approved operations      |
| Accounting       | Tracks positions, costs and realized performance |
| Buyback          | Converts eligible capital into `$PONS`           |

The architecture is intentionally modular.

---

# 05 — The Economic Machine

The complete system can be visualized as a closed economic loop:

```text
                         ┌───────────────┐
                         │ PONS ACTIVITY │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │     FEES      │
                         └───────┬───────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │     TREASURY      │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │ CAPITAL ALLOCATION│
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │   AGENT / MODEL   │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │ MARKET EXECUTION  │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │  REALIZED RESULT  │
                       └─────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
                 RETAIN                   BUYBACK
                    │                         │
                    │                         ▼
                    │                       $PONS
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                           PONS ECOSYSTEM
```

The important property is that **every stage has a separate accounting boundary**.

---

# 06 — Fee Flow

The intended fee flow is:

```text
┌────────────────────┐
│    PONS V2         │
│                    │
│ Launch / Protocol  │
│ Activity           │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│   ELIGIBLE FEES    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ FEE ROUTER /       │
│ DISTRIBUTOR        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ PONSDIVIDENDS      │
│ TREASURY           │
└────────────────────┘
```

The current prototype intentionally keeps the fee source and treasury logic modular.

The final production integration may determine:

* which fees qualify;
* what percentage is allocated;
* when fees are transferred;
* whether allocation is dynamic;
* which treasury address receives the funds.

---

# 07 — Treasury Architecture

The treasury is the central capital-management layer.

It should not treat all assets as immediately deployable.

A conceptual allocation is:

```text
                         TREASURY
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
          RESERVE        TRADING       BUYBACK
          CAPITAL        CAPITAL       CAPITAL
              │             │             │
              │             ▼             │
              │           AGENT           │
              │             │             │
              │             ▼             │
              │          TRADES            │
              │             │             │
              │             ▼             │
              │            PNL             │
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                      BUYBACK ENGINE
```

Example configuration:

```text
Reserve Capital      30%
Trading Capital      50%
Buyback Capital      20%
```

These values are **illustrative testing parameters only**.

A future implementation could make the allocation dynamic.

---

# 08 — Automated Agent

The agent is the active decision-making component.

Its role is not to blindly trade.

Its role is to:

1. observe the available market universe;
2. identify eligible assets;
3. evaluate opportunities;
4. generate candidate actions;
5. pass those actions through risk controls;
6. execute only authorized operations;
7. update portfolio accounting.

The conceptual pipeline is:

```text
                    MARKET UNIVERSE
                           │
                           ▼
                  ┌─────────────────┐
                  │     SCANNER     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    FILTERS      │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │     MODEL       │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   RISK ENGINE   │
                  └────────┬────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 APPROVE        REJECT
                    │             │
                    ▼             ▼
                EXECUTION        HOLD
```

The agent operates **within constraints**, not above them.

---

# 09 — Asset Universe

The intended long-term universe is the eligible stock / asset universe available through the relevant Robinhood Chain infrastructure.

The prototype conceptually begins with:

```text
                    ROBINHOOD CHAIN
                           │
                           ▼
                 ELIGIBLE ASSET SET
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           STOCK A      STOCK B      STOCK C
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ASSET FILTERING
                           │
                           ▼
                    AGENT UNIVERSE
```

Not every listed asset should automatically be considered tradeable.

Eligibility may depend on:

```text
Liquidity
Volume
Execution availability
Price data
Market availability
Slippage
Risk characteristics
```

The final asset universe must be determined by the actual infrastructure available at deployment.

---

# 10 — Strategy Layer

The strategy layer converts market information into candidate actions.

Conceptually:

```text
PRICE ───────────┐
VOLUME ──────────┤
LIQUIDITY ───────┤
VOLATILITY ──────┤
HISTORY ────────►│
                 ▼
          ┌──────────────┐
          │    MODEL     │
          └──────┬───────┘
                 │
                 ▼
            TRADE SIGNAL
```

A candidate signal could contain:

```text
Asset
Direction
Confidence
Target allocation
Entry conditions
Exit conditions
Maximum position
Maximum loss
```

Example:

```text
Asset:             ASSET_A
Direction:         LONG
Confidence:        0.82
Target allocation: 5%
Maximum position:  7%
```

These values are illustrative and do not represent a validated trading strategy.

---

# 11 — Risk Engine

The risk engine is a mandatory gate.

```text
                 STRATEGY
                    │
                    ▼
              TRADE SIGNAL
                    │
                    ▼
             ┌──────────────┐
             │ RISK ENGINE  │
             └──────┬───────┘
                    │
             ┌──────┴──────┐
             ▼             ▼
          APPROVE         REJECT
             │             │
             ▼             ▼
         EXECUTION        HOLD
```

Potential constraints include:

```text
Maximum single-asset exposure
Maximum portfolio exposure
Maximum daily loss
Maximum drawdown
Maximum turnover
Maximum trade size
Minimum reserve
Maximum slippage
Maximum number of positions
```

The strategy cannot override these constraints.

---

# 12 — Execution Engine

Once a signal is approved:

```text
SIGNAL
  │
  ▼
RISK CHECK
  │
  ▼
CAPITAL CHECK
  │
  ▼
LIQUIDITY CHECK
  │
  ▼
SLIPPAGE CHECK
  │
  ▼
EXECUTE
  │
  ▼
CONFIRM
  │
  ▼
ACCOUNT
```

A failed execution must not be recorded as a successful trade.

The execution layer should record:

```text
Asset
Side
Requested size
Executed size
Execution price
Execution timestamp
Execution cost
Slippage
Transaction identifier
```

---

# 13 — Portfolio Accounting

PonsDividends should maintain a complete portfolio state.

```text
                    PORTFOLIO
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
       CASH         POSITIONS        RISK
        │              │              │
        ▼              ▼              ▼
   Available      Asset / Size    Exposure
   Capital        Entry Price     Drawdown
                  Current Value   Limits
```

Each position should track at minimum:

```text
Asset
Quantity
Average entry
Current value
Realized PnL
Unrealized PnL
Allocation
```

This allows the treasury to distinguish capital that is:

```text
available
deployed
locked in positions
realized
unrealized
reserved for buybacks
```

---

# 14 — PnL Accounting

PonsDividends must distinguish between gross and net performance.

```text
                 GROSS PNL
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
      Trading Costs        Slippage
          │                   │
          └─────────┬─────────┘
                    ▼
                 NET PNL
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       RETAIN              ELIGIBLE
                         BUYBACK CAPITAL
```

The system should not treat an unrealized gain as automatically available buyback capital.

A conservative prototype should primarily use **realized net performance** for buyback eligibility.

---

# 15 — Buyback Engine

The buyback engine is the mechanism responsible for strategic `$PONS` acquisition.

It receives capital only after treasury and risk conditions have been satisfied.

```text
                 TREASURY
                    │
                    ▼
              BUYBACK POOL
                    │
                    ▼
            ┌───────────────┐
            │ BUYBACK ENGINE│
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     LIQUIDITY   SLIPPAGE    COOLDOWN
        │           │           │
        └───────────┼───────────┘
                    ▼
              EXECUTE BUYBACK
                    │
                    ▼
                   $PONS
```

The buyback engine should not blindly purchase `$PONS` at every opportunity.

---

# 16 — Strategic Buybacks

The concept of PonsDividends depends on **strategic** rather than unconditional buybacks.

Instead of:

```text
FEES
 ↓
BUY $PONS
```

the prototype uses:

```text
FEES
 ↓
TREASURY
 ↓
CAPITAL DEPLOYMENT
 ↓
REALIZED RESULT
 ↓
BUYBACK ELIGIBILITY
 ↓
MARKET CONDITIONS
 ↓
BUY $PONS
```

Potential conditions:

```text
✓ Treasury reserve healthy
✓ Buyback capital available
✓ Minimum buyback threshold reached
✓ Cooldown expired
✓ Liquidity sufficient
✓ Slippage acceptable
✓ Risk state permits buyback
✓ Execution route available
```

Only then:

```text
                    ELIGIBLE
                       │
                       ▼
                 BUYBACK $PONS
```

Otherwise:

```text
                  NOT ELIGIBLE
                       │
                       ▼
                  HOLD CAPITAL
```

---

# 17 — The Buyback Decision

The buyback decision can be represented as a deterministic gate:

```text
                         BUYBACK?
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    Treasury Health    Market Health     Risk State
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                     BUYBACK SCORE
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
              EXECUTE                WAIT
                 │                     │
                 ▼                     ▼
               $PONS               TREASURY
```

A more advanced future implementation could evaluate:

```text
Liquidity depth
Price impact
Recent buybacks
Treasury growth
Realized PnL
Current exposure
Market volatility
Cooldown state
```

The exact algorithm is intentionally left open during the prototype phase.

---

# 18 — Complete Execution Cycle

The complete PonsDividends machine can be represented as:

```text
╔══════════════════════════════════════════════════════════════════════╗
║                         PONSDIVIDENDS LOOP                           ║
╚══════════════════════════════════════════════════════════════════════╝

     PONS ACTIVITY
           │
           ▼
     ┌───────────┐
     │    FEES   │
     └─────┬─────┘
           │
           ▼
     ┌───────────┐
     │ TREASURY  │
     └─────┬─────┘
           │
     ┌─────┴──────────────┐
     │                    │
     ▼                    ▼
  RESERVE              DEPLOYABLE
  CAPITAL                CAPITAL
                            │
                            ▼
                     ┌─────────────┐
                     │    AGENT    │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    SCAN     │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   ANALYZE   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │     RISK    │
                     └──────┬──────┘
                            │
                       APPROVED
                            │
                            ▼
                     ┌─────────────┐
                     │   EXECUTE   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   ACCOUNT   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    PNL      │
                     └──────┬──────┘
                            │
                            ▼
                   BUYBACK ELIGIBILITY
                            │
                     ┌──────┴──────┐
                     ▼             ▼
                    YES            NO
                     │             │
                     ▼             ▼
                 BUY $PONS       HOLD
                     │
                     ▼
                  TREASURY
```

This is the central mechanism the prototype is intended to explain.

---

# 19 — Agent Permissions

The agent should operate under explicit permissions.

```text
                         OWNER
                           │
                           ▼
                    CONFIGURATION
                           │
                           ▼
                         AGENT
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
            TRADE       REBALANCE     BUYBACK
```

The agent should **not** automatically possess unrestricted treasury authority.

Normal agent permissions should be constrained by:

```text
Maximum trade size
Maximum exposure
Maximum daily loss
Maximum buyback
Minimum reserve
Approved assets
Approved execution routes
```

Administrative functions should remain separate.

---

# 20 — Failure & Emergency States

The system must fail closed.

## Normal

```text
ACTIVE
  │
  ├── SCAN
  ├── TRADE
  ├── ACCOUNT
  └── BUYBACK
```

## Caution

```text
DRAWDOWN / RISK EVENT
          │
          ▼
       CAUTION
          │
          ├── Reduce exposure
          ├── Reduce position size
          └── Restrict new trades
```

## Halted

```text
CRITICAL CONDITION
        │
        ▼
     HALTED
        │
        ├── New trades     ✕
        ├── Buybacks       ✕
        └── Risk exposure  → protected
```

The final implementation should provide an explicit emergency control.

---

# 21 — On-Chain / Off-Chain Boundary

A realistic automated trading architecture may separate computation from settlement.

```text
                         OFF-CHAIN
┌──────────────────────────────────────────────────┐
│                                                  │
│  Market Data                                     │
│  Asset Scanner                                   │
│  Strategy Model                                  │
│  Portfolio Analytics                             │
│  Risk Calculation                                │
│                                                  │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
                  SIGNED ACTION
                       │
                       ▼
                         ON-CHAIN
┌──────────────────────────────────────────────────┐
│                                                  │
│  Permission Validation                           │
│  Treasury Limits                                 │
│  Execution                                       │
│  Accounting                                      │
│  Buyback Settlement                              │
│                                                  │
└──────────────────────────────────────────────────┘
```

This boundary is important because computational intelligence and capital custody have different security requirements.

The off-chain agent can be sophisticated.

The on-chain layer should remain restrictive.

---

# 22 — Accounting Invariants

The prototype should enforce strong accounting properties.

### Treasury conservation

```text
Starting Treasury
+ Fees Received
+ Realized Net PnL
- Buybacks
- Authorized Costs
=
Current Accounted Treasury
```

### Portfolio conservation

```text
Capital
=
Cash
+
Open Positions
```

subject to the exact execution and accounting model.

### Buyback conservation

```text
Total Buyback Spend
≤
Buyback-Eligible Capital
```

### Reserve protection

```text
Treasury Reserve
≥
Configured Minimum Reserve
```

during normal operations.

### No phantom PnL

```text
Unrealized PnL
≠
Realized Capital
```

A price increase on an open position should not automatically create spendable buyback capital.

---

# 23 — Testing Model

The purpose of the prototype is to stress the complete mechanism.

Testing should progress from simple to complex:

```text
                              COMPLEXITY
                                  ▲
                                  │
                       ┌──────────┴──────────┐
                       │ Multi-asset         │
                       │ portfolio           │
                       └──────────┬──────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ Buyback execution   │
                       └──────────┬──────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ PnL accounting      │
                       └──────────┬──────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ Risk controls       │
                       └──────────┬──────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ Single trade        │
                       └──────────┬──────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ Fee → Treasury      │
                       └─────────────────────┘
```

Recommended scenarios:

<details>
<summary><strong>Core treasury tests</strong></summary>

* Zero-fee treasury
* Small treasury
* Large treasury
* Reserve threshold
* Capital allocation
* Fee accumulation
* Unauthorized treasury access

</details>

<details>
<summary><strong>Trading tests</strong></summary>

* Single asset
* Multiple assets
* Profitable trade
* Losing trade
* High volatility
* Low liquidity
* Maximum position reached
* Maximum exposure reached
* Maximum daily loss reached
* Execution failure
* Slippage failure

</details>

<details>
<summary><strong>Buyback tests</strong></summary>

* Buyback threshold not reached
* Buyback threshold reached
* Cooldown active
* Cooldown expired
* Insufficient liquidity
* Excessive slippage
* Buyback success
* Buyback transaction failure
* Treasury reserve protection

</details>

<details>
<summary><strong>Emergency tests</strong></summary>

* Agent pause
* Trading halt
* Buyback halt
* Market-data failure
* Invalid signal
* Unauthorized executor
* Treasury protection
* Recovery path

</details>

---

# 24 — Example Scenario

Assume the experimental treasury contains:

```text
Total Treasury        $100,000
Reserve               $30,000
Trading Capital       $50,000
Buyback Capital       $20,000
```

The agent deploys part of the trading allocation.

After a completed cycle:

```text
Gross PnL              +$8,000
Trading Costs          -$700
Slippage               -$300
──────────────────────────────
Net Realized PnL       +$7,000
```

Suppose the experimental policy allocates:

```text
50% → Treasury retention
50% → Buyback eligibility
```

Then:

```text
Treasury retention     $3,500
Buyback eligibility    $3,500
```

The system does **not** immediately buy `$PONS`.

It first evaluates:

```text
✓ Reserve healthy
✓ Buyback capital available
✓ Cooldown expired
✓ Liquidity sufficient
✓ Slippage acceptable
✓ Risk state normal
```

Only then:

```text
$3,500
   │
   ▼
BUYBACK ENGINE
   │
   ▼
$PONS
```

The example is purely illustrative.

---

# 25 — Current vs Future

| Capability                  |    Prototype | Future Direction |
| --------------------------- | -----------: | ---------------: |
| `$DIVIDENDS` test asset     |            ✓ |        Reference |
| Fee-funded treasury         | Experimental |                ✓ |
| Capital allocation          | Experimental |                ✓ |
| Automated agent             |    Prototype |                ✓ |
| Asset discovery             |      Planned |                ✓ |
| Multi-asset universe        |      Planned |                ✓ |
| Risk engine                 |    Prototype |                ✓ |
| Portfolio accounting        |      Planned |                ✓ |
| PnL accounting              |      Planned |                ✓ |
| Strategic buybacks          |      Planned |                ✓ |
| Dynamic buyback policy      |      Planned |                ✓ |
| Robinhood Chain integration |      Planned |                ✓ |
| Pons fee integration        |      Planned |                ✓ |
| Emergency controls          |      Planned |                ✓ |
| Factory deployment          |            — |          Planned |
| Production deployment       |            — |          Planned |
| Security audit              |            — |         Required |

---

# 26 — Repository Structure

Recommended repository structure:

```text
contracts/
├── treasury/
│   └── PonsDividendsTreasury.sol
│
├── agent/
│   ├── PonsDividendsAgent.sol
│   └── PonsDividendsRiskEngine.sol
│
├── buyback/
│   └── PonsDividendsBuyback.sol
│
├── interfaces/
│   ├── IPonsDividends.sol
│   └── IPonsDividendsExecutor.sol
│
└── libraries/
    └── PonsDividendsAccounting.sol

agent/
├── market/
├── strategy/
├── risk/
├── portfolio/
└── execution/

test/
├── treasury/
├── agent/
├── risk/
├── accounting/
├── buyback/
└── integration/

assets/
├── dividends-overview.gif
├── dividends-token.png
├── dividends-agent.gif
├── dividends-trading.gif
└── dividends-buyback.gif

README.md
```

The repository is intentionally structured around the economic machine rather than a single monolithic contract.

---

# 27 — Design Principles

### 01 — Fees first

The system can only deploy capital that actually exists.

### 02 — Risk before execution

A strategy signal is not an execution instruction until it passes the risk layer.

### 03 — No artificial yield

PonsDividends does not promise APY, APR or fixed returns.

### 04 — Realized capital matters

Unrealized market gains should not automatically become buyback capital.

### 05 — Treasury protection

A minimum reserve should remain protected from ordinary agent operations.

### 06 — Strategic buybacks

Buybacks should respond to treasury and market conditions.

### 07 — Modular intelligence

The strategy can evolve without redesigning the treasury.

### 08 — Transparent accounting

Capital movements should be reconstructable from protocol state and events.

### 09 — Test first

The `$DIVIDENDS` asset exists specifically to make the mechanism reproducible and testable.

### 10 — Permission boundaries

The automated agent should never receive unrestricted authority over the treasury.

---

# 28 — What This Prototype Does Not Do

The current prototype does **not**:

* guarantee trading profits;
* guarantee positive PnL;
* guarantee `$PONS` buybacks;
* guarantee token appreciation;
* guarantee dividend payments;
* guarantee a specific buyback frequency;
* trade every asset automatically;
* deploy the entire treasury;
* bypass liquidity constraints;
* bypass risk controls;
* provide price protection;
* constitute financial advice;
* constitute a regulated investment product;
* constitute audited production infrastructure;
* imply that `$DIVIDENDS` has production utility;
* imply that `$DIVIDENDS` represents future Pons economics.

> **`$DIVIDENDS` is a test asset used to demonstrate the PonsDividends mechanism.**

---

# 29 — Final Architecture

The complete concept can be reduced to one architecture:

```text
╔══════════════════════════════════════════════════════════════════════╗
║                         PONSDIVIDENDS                                ║
╚══════════════════════════════════════════════════════════════════════╝

                         PONS ECOSYSTEM
                                │
                                ▼
                         PROTOCOL ACTIVITY
                                │
                                ▼
                              FEES
                                │
                                ▼
                  ┌──────────────────────────┐
                  │   PONSDIVIDENDS          │
                  │        TREASURY          │
                  └────────────┬─────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              RESERVE       TRADING       BUYBACK
              CAPITAL       CAPITAL       CAPITAL
                                │             │
                                ▼             │
                         ┌─────────────┐       │
                         │   AGENT     │       │
                         └──────┬──────┘       │
                                │              │
                                ▼              │
                         ASSET UNIVERSE        │
                                │              │
                                ▼              │
                           STRATEGY            │
                                │              │
                                ▼              │
                           RISK ENGINE          │
                                │              │
                                ▼              │
                           EXECUTION            │
                                │              │
                                ▼              │
                              TRADES             │
                                │              │
                                ▼              │
                          REALIZED PNL          │
                                │              │
                       ┌────────┴────────┐      │
                       │                 │      │
                       ▼                 ▼      │
                    RETAIN          ELIGIBLE    │
                                     CAPITAL    │
                                         │      │
                                         └──┬───┘
                                            ▼
                                    BUYBACK ENGINE
                                            │
                                            ▼
                                           $PONS
                                            │
                                            ▼
                                      PONS ECOSYSTEM
```

The core loop is:

```text
        FEES
          ↓
      TREASURY
          ↓
        AGENT
          ↓
        TRADE
          ↓
         PNL
          ↓
      BUYBACK
          ↓
         $PONS
```

And the reference testing asset is:

```text
╭────────────────────────────────────────────╮
│                                            │
│              PonsDividends                 │
│                                            │
│                $DIVIDENDS                  │
│                                            │
│          TEST / EXPERIMENTAL ASSET         │
│                                            │
╰────────────────────────────────────────────╯
```

The objective of PonsDividends is not to manufacture a fixed return.

It is to explore an architecture in which **protocol-generated fees become treasury capital, treasury capital can be deployed by an automated and risk-constrained agent, realized economic performance can be accounted for transparently, and eligible capital can subsequently be used for strategic `$PONS` buybacks.**

---

# 30 — Summary

**PonsDividends** is an experimental automated treasury mechanism built around:

```text
PROTOCOL FEES
      ↓
TREASURY
      ↓
CAPITAL ALLOCATION
      ↓
AUTOMATED AGENT
      ↓
MARKET OPERATIONS
      ↓
REALIZED PNL
      ↓
BUYBACK ELIGIBILITY
      ↓
STRATEGIC $PONS BUYBACK
```

The prototype uses:

```text
PonsDividends
$DIVIDENDS
```

as its dedicated **test asset**.

The test asset exists to make the mechanism understandable, reproducible and independently testable.

The long-term architecture is intended to remain modular:

```text
PONS V2
   │
   ▼
FEE INFRASTRUCTURE
   │
   ▼
PONSDIVIDENDS TREASURY
   │
   ▼
AUTOMATED AGENT
   │
   ├── Market Discovery
   ├── Strategy
   ├── Risk
   ├── Execution
   └── Accounting
          │
          ▼
       BUYBACK
          │
          ▼
         $PONS
```

> **Pons V2 · PonsDividends · Experimental Automated Treasury Infrastructure**

> **`$DIVIDENDS` — Test Asset · Experimental Use Only · Not Financial Advice**

---

## License

This implementation is released under the **MIT License**.

---

<p align="center">
  <sub>
    Pons V2 · PonsDividends · Experimental Treasury, Trading & Buyback Infrastructure
  </sub>
</p>
