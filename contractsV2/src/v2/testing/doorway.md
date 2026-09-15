<p align="center">
  <img src="./doorway.jpg" alt="Pons Doorway" width="180">
</p>

<h1 align="center">Pons Doorway</h1>

<p align="center">
  <strong>Liquidity, carried across the bridge.</strong>
</p>

<p align="center">
  <code>Solana ↔ Pons Doorway ↔ Robinhood Chain</code>
</p>

---

> **Pons Doorway** is the cross-chain liquidity migration layer of the Pons ecosystem, designed to allow eligible Solana assets to migrate into Robinhood Chain and Robinhood-native liquidity to move back toward Solana.
>
> At the center of the Doorway infrastructure sits **$DOORWAY**, the native economic security asset used by relayers and infrastructure participants.

---

# Overview

Pons Doorway is designed to connect two liquidity environments:

```text
                    PONS DOORWAY

        ┌───────────────────────────────┐
        │                               │
        │           SOLANA              │
        │                               │
        │       Token / Liquidity       │
        │                               │
        └──────────────┬────────────────┘
                       │
                       │  MIGRATE
                       ▼
              ┌─────────────────┐
              │                 │
              │  Pons Doorway   │
              │                 │
              │  Lock           │
              │  Verify         │
              │  Attest         │
              │  Settle         │
              │                 │
              └────────┬────────┘
                       │
                       │  DEPLOY
                       ▼
        ┌───────────────────────────────┐
        │                               │
        │       ROBINHOOD CHAIN         │
        │                               │
        │       Token / Liquidity       │
        │                               │
        └───────────────────────────────┘
```

The same infrastructure operates in reverse:

```text
Solana → Robinhood Chain
Robinhood Chain → Solana
```

Pons Doorway is not intended to be a generic asset bridge.

It is designed around the concept of **liquidity migration**.

A project should be able to expand into another ecosystem without having to abandon the liquidity, identity and infrastructure it has already established.

---

# Why Pons Doorway?

Liquidity is often fragmented across ecosystems.

A token can have:

- a community on Solana
- established liquidity on Solana
- existing holders
- active trading
- but no presence on Robinhood Chain

The reverse can also happen.

Pons Doorway provides a structured migration path between these environments.

The objective is simple:

> **Move the liquidity without forcing the ecosystem to start again.**

---

# Architecture

Pons Doorway follows the modular architecture used throughout the Pons V2 ecosystem.

The Doorway separates migration requests, cross-chain verification, execution and economic security.

```text
                     ┌───────────────────┐
                     │   Pons Doorway    │
                     └─────────┬─────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   Request Layer        Attestation Layer      Settlement
          │                    │                    │
          │                    │                    │
          ▼                    ▼                    ▼
    Migration ID           Guardian             Executor
    Nonce                   Relayer              Adapter
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                       Liquidity Vault
```

Alongside the migration layer sits the `$DOORWAY` security layer:

```text
                    $DOORWAY
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
       Relayers     Attestation    Security
        Bonds         Weight        Reserve
          │             │             │
          └─────────────┼─────────────┘
                        │
                        ▼
                  Pons Doorway
```

---

# Core Components

| Component | Responsibility |
|---|---|
| `PonsDoorway` | Main migration orchestrator |
| `PonsDoorwayRegistry` | Supported asset registry |
| `PonsDoorwayVault` | Liquidity accounting / custody layer |
| `PonsDoorwayExecutor` | Executes approved migrations |
| `PonsDoorwayGuardian` | Cross-chain verification layer |
| `PonsDoorwayStaking` | Relayer `$DOORWAY` bonds |
| `DoorwayToken` | Native `$DOORWAY` asset |
| Relayer | Observes and reports cross-chain events |
| Adapter | Connects Doorway settlement to a specific asset |

The reference implementation currently models the primary orchestration layer in `PonsDoorway.sol`.

---

# Migration Lifecycle

Every migration follows an explicit state machine.

```text
NONE
 │
 ▼
REQUESTED
 │
 │ verification
 ▼
ATTESTED
 │
 ▼
EXECUTING
 │
 ▼
COMPLETED
```

A migration can alternatively enter:

```text
REQUESTED
     │
     ▼
 CANCELLED
```

when it remains unresolved beyond the cancellation window.

This makes every migration independently traceable.

---

# Solana → Robinhood Chain

A Solana project wishing to migrate liquidity into Robinhood Chain begins by registering its asset with the Doorway.

Conceptually:

```text
Solana Token
     │
     ▼
Source Liquidity
     │
     ▼
Solana Transaction
     │
     ▼
Relayer observes transaction
     │
     ▼
Guardian attestation
     │
     ▼
Pons Doorway
     │
     ▼
Robinhood settlement
     │
     ▼
Robinhood liquidity
```

The original Solana transaction becomes the source reference for the migration.

The Doorway records the source transaction hash to prevent the same transaction from being processed twice.

```solidity
mapping(bytes32 => bool) public usedSourceTransactions;
```

---

# Robinhood Chain → Solana

The reverse path uses the same migration architecture.

```text
Robinhood Token
      │
      ▼
Pons Doorway
      │
      ▼
Liquidity locked / accounted
      │
      ▼
Migration request
      │
      ▼
Relayer
      │
      ▼
Solana settlement
      │
      ▼
Solana liquidity
```

The Doorway is therefore directionally symmetric.

Both paths are represented by:

```solidity
enum MigrationDirection {
    SOLANA_TO_ROBINHOOD,
    ROBINHOOD_TO_SOLANA
}
```

---

# Migration IDs

Every migration receives a deterministic identifier.

Conceptually:

```text
migrationId =
keccak256(
    chainId,
    doorway,
    initiator,
    sourceAsset,
    destinationAsset,
    destination,
    amount,
    nonce
)
```

This allows frontends, explorers and indexers to treat each migration as an independent object.

Example:

```text
0x91...4af
```

can represent an entire cross-chain migration lifecycle.

The ID remains associated with:

```text
Source Transaction
       ↓
Migration ID
       ↓
Attestation
       ↓
Destination Transaction
```

---

# Attestation Layer

Cross-chain execution introduces an important boundary:

> Robinhood Chain cannot natively observe Solana state.

Pons Doorway therefore separates **requesting** a migration from **attesting** that the source-side event actually occurred.

```text
                SOLANA
                   │
                   │ transaction
                   ▼
              Relayer Node
                   │
                   ▼
              Guardian
                   │
                   │ attestation
                   ▼
            Pons Doorway
```

The reference contract models this through:

```solidity
function attestMigration(...)
```

A future production implementation could replace the simplified guardian model with:

- multi-signer attestations
- threshold signatures
- MPC
- light-client verification
- ZK proofs
- dedicated validator infrastructure

The current implementation intentionally leaves this layer modular.

---

# Liquidity Accounting

Pons Doorway treats liquidity separately from the migration request itself.

Robinhood-side liquidity can be accounted for through:

```solidity
mapping(address => uint256) public tokenLiquidity;
```

Solana-side representations can be tracked through:

```solidity
mapping(bytes32 => uint256) public solanaLiquidity;
```

This allows the Doorway to maintain explicit liquidity accounting rather than treating a migration as a simple token transfer.

---

# Fees

Doorway migrations can optionally charge a protocol fee.

The reference configuration uses:

```text
0.25%
```

with a hard maximum of:

```text
1%
```

The fee is calculated as:

```text
fee = amount × migrationFeeBps / 10,000
```

Example:

```text
Migration:
100,000 TOKEN

Doorway fee:
0.25%

Fee:
250 TOKEN

Net migration:
99,750 TOKEN
```

Fees can be routed toward the Pons treasury, Doorway infrastructure and future security mechanisms.

---

# Supported Assets

Pons Doorway does not automatically support every asset.

Robinhood-side assets are explicitly registered:

```solidity
setRobinhoodToken(token, true);
```

Solana mints are registered using their 32-byte public-key representation:

```solidity
setSolanaMint(mint, true);
```

This creates an explicit asset registry.

A future version can introduce:

```text
PonsDoorwayRegistry
```

containing:

- token metadata
- Solana mint
- Robinhood token
- decimals
- migration limits
- liquidity requirements
- fee policy
- adapter
- guardian configuration

---

# Migration Request

A Robinhood → Solana migration starts with:

```solidity
migrateToSolana(
    robinhoodToken,
    solanaMint,
    solanaRecipient,
    amount,
    minAmountOut
)
```

The Doorway creates:

```text
Migration ID
Nonce
Amount
Fee
Source Asset
Destination Asset
Destination Wallet
Timestamp
Status
```

and emits:

```solidity
event MigrationRequested(...)
```

This event becomes the primary object consumed by the Doorway infrastructure.

---

# Solana Origin Requests

For Solana → Robinhood migrations, a relayer submits the observed source transaction:

```solidity
requestFromSolana(
    solanaMint,
    solanaSender,
    robinhoodToken,
    robinhoodRecipient,
    amount,
    sourceNonce,
    sourceTxHash
)
```

The Doorway creates the corresponding migration object.

The source transaction cannot be reused:

```solidity
require(
    !usedSourceTransactions[sourceTxHash],
    "PonsDoorway: source tx used"
);
```

This prevents a single Solana deposit from being credited multiple times.

---

# Execution

Once a migration has been attested, the relayer can execute it:

```solidity
executeMigration(
    migrationId,
    destinationTxHash
);
```

The lifecycle becomes:

```text
REQUESTED
    ↓
ATTESTED
    ↓
EXECUTING
    ↓
COMPLETED
```

The destination transaction hash is associated permanently with the migration.

This creates a complete audit trail:

```text
Source TX
    ↓
Migration ID
    ↓
Attestation
    ↓
Destination TX
```

---

# Cancellation

Migrations are not immediately cancellable.

A safety window is introduced:

```text
30 minutes
```

After the cancellation delay, either the migration initiator or the Guardian can cancel an unresolved migration.

This provides an emergency escape path while preventing arbitrary immediate cancellation of migration requests.

---

# $DOORWAY

At the center of the Pons Doorway economic layer is:

```text
$DOORWAY
```

$DOORWAY is the native coordination and security asset of the Doorway network.

It is **not simply a governance token**.

Its primary purpose is to provide economic security around cross-chain settlement.

```text
                         $DOORWAY
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
           RELAYERS       ATTESTATION     SECURITY
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                       PONS DOORWAY
```

---

# Doorway Security Bond

Relayers participating in Pons Doorway are required to maintain a minimum amount of `$DOORWAY` as a security bond.

```text
Relayer
   │
   │ stake $DOORWAY
   ▼
Doorway Security Layer
   │
   ├── Observe
   ├── Verify
   ├── Attest
   └── Settle
```

The principle is simple:

> **A relayer should have something to lose when putting cross-chain liquidity at risk.**

A relayer behaving correctly keeps its stake.

A relayer submitting malicious or demonstrably invalid attestations can have part of its `$DOORWAY` bond slashed.

---

# Relayer Staking

A dedicated future module can maintain the security deposits of Doorway operators.

Conceptually:

```solidity
interface IPonsDoorwayStaking {

    function stake(
        uint256 amount
    ) external;

    function unstake(
        uint256 amount
    ) external;

    function slash(
        address relayer,
        uint256 amount,
        bytes32 migrationId
    ) external;

    function bondedBalance(
        address relayer
    ) external view returns (uint256);
}
```

A relayer therefore has two distinct balances:

```text
Wallet
  │
  ├── Operational funds
  │
  └── $DOORWAY security bond
```

The bond is independent from the liquidity being migrated.

---

# Attestation Weight

$DOORWAY can determine the economic weight of a relayer inside the Doorway attestation layer.

A simplified model:

```text
Attestation Weight
        =
Bonded $DOORWAY
        ×
Relayer Reputation
```

This creates a gradual trust model.

A new relayer may begin with:

```text
small bond
     ↓
limited weight
```

while an established infrastructure operator may maintain:

```text
larger bond
     ↓
higher weight
```

The exact consensus mechanism is intentionally left open for the production implementation.

---

# Slashing

The Doorway security layer can monitor migration attestations.

A relayer may become slashable if it:

- attests a transaction that does not exist
- attests the same source transaction twice
- signs conflicting migration data
- reports an incorrect amount
- attempts to execute an invalid migration

Conceptually:

```text
INVALID ATTESTATION
        │
        ▼
   Fraud Proof
        │
        ▼
    Guardian
        │
        ▼
     SLASH
        │
        ▼
$DOORWAY removed
from relayer bond
```

Slashed tokens can be routed toward:

```text
Protocol Treasury
       +
Security Reserve
       +
Migration Recovery Pool
```

---

# Doorway Security Reserve

A portion of the `$DOORWAY` ecosystem can form a dedicated security reserve.

```text
             $DOORWAY
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   Relayer Bonds     Security Reserve
        │                 │
        │                 │
        ▼                 ▼
   Attestation       Emergency
    Security          Recovery
```

The reserve provides an additional economic backstop for exceptional migration events.

It is not intended to guarantee every possible bridge failure.

Instead, it provides a controlled pool for approved recovery operations when the protocol determines that a migration has entered an exceptional state.

---

# Migration Tiers

$DOORWAY can also be used by projects integrating directly with Pons Doorway.

Projects maintaining a defined amount of `$DOORWAY` may qualify for increased migration limits or preferential Doorway fees.

Illustrative configuration:

```text
Tier          $DOORWAY Bond       Migration Limit

STANDARD          0                  Base

BUILDER        10,000               Increased

PARTNER        50,000               Higher

CORE          250,000               Custom
```

These values are illustrative and can be modified by the Doorway configuration.

The underlying principle remains:

> **The more economically aligned a participant is with the Doorway infrastructure, the greater its access to the infrastructure can become.**

---

# Doorway Credits

$DOORWAY can also serve as the accounting basis for Doorway infrastructure credits.

Credits may be accumulated through legitimate participation:

```text
Successful migration
        +
Valid attestation
        +
Liquidity contribution
        +
Relayer uptime
        ↓
Doorway Credits
```

Credits can potentially be used for:

- migration fee discounts
- increased rate limits
- priority settlement
- relayer registration
- ecosystem integrations

This creates a direct relationship between Doorway usage and its native asset.

---

# Why $DOORWAY Exists

The fundamental purpose of `$DOORWAY` is to make cross-chain infrastructure economically accountable.

Without an economic bond:

```text
Relayer
   │
   └── submits bad data
             │
             ▼
       limited direct cost
```

With `$DOORWAY`:

```text
Relayer
   │
   ├── stakes $DOORWAY
   │
   ├── performs attestations
   │
   └── participates in settlement
            │
            ▼
       malicious behavior
            │
            ▼
          SLASH
```

The token therefore sits directly between:

```text
Participation
      +
Security
      +
Settlement
```

---

# The Doorway Flywheel

The intended ecosystem loop is:

```text
More migrations
       │
       ▼
More Doorway usage
       │
       ▼
More relayers / liquidity
       │
       ▼
Greater demand for security bonds
       │
       ▼
More $DOORWAY bonded
       │
       ▼
Stronger economic security
       │
       ▼
More confidence in Doorway
       │
       └──────────────────┐
                          │
                          ▼
                    More migrations
```

This makes `$DOORWAY` an infrastructural component of the Doorway rather than a token simply attached to it.

---

# Security Model

Pons Doorway is designed around several independent protections.

### Replay Protection

Source transactions cannot be reused.

```solidity
usedSourceTransactions[sourceTxHash]
```

### Migration Uniqueness

Every migration receives a unique nonce and deterministic ID.

### Guardian Boundary

Cross-chain claims require attestation before execution.

### Explicit Asset Registry

Unsupported assets cannot enter the migration system.

### Fee Limits

The protocol fee has a hard-coded maximum.

```solidity
MAX_FEE_BPS = 100;
```

### Doorway Pause

The owner can stop new migration activity:

```solidity
setDoorwayActive(false);
```

### Economic Security

Doorway relayers can be required to maintain `$DOORWAY` bonds that are subject to protocol-defined slashing rules.

---

# Future Architecture

The reference contract is intentionally compact.

A production implementation could be separated into:

```text
contracts/
├── PonsDoorway.sol
├── PonsDoorwayRegistry.sol
├── PonsDoorwayVault.sol
├── PonsDoorwayRelayer.sol
├── PonsDoorwayGuardian.sol
├── PonsDoorwayExecutor.sol
├── PonsDoorwayStaking.sol
├── DoorwayToken.sol
│
├── interfaces/
│   ├── IPonsDoorway.sol
│   ├── IPonsDoorwayAdapter.sol
│   ├── IPonsDoorwayGuardian.sol
│   ├── IPonsDoorwayRegistry.sol
│   └── IPonsDoorwayStaking.sol
│
└── adapters/
    ├── PonsRobinhoodAdapter.sol
    └── PonsSolanaAdapter.sol
```

This preserves the modular philosophy of Pons V2, where deployment, verification, execution, locking and fee accounting are separated into dedicated components.

---

# Example Migration

Imagine a Solana token:

```text
$EXAMPLE
```

with:

```text
Solana Mint:
7xKX...Pons

Liquidity:
$250,000
```

The project decides to migrate into Robinhood Chain.

The process becomes:

```text
1. Register $EXAMPLE

2. Deposit / lock source liquidity

3. Create migration request

4. Doorway generates:

   Migration ID
   0x91...4af

5. Relayer observes Solana transaction

6. Guardian verifies the source event

7. Doorway moves to ATTESTED

8. Robinhood adapter executes settlement

9. Destination liquidity is created

10. Migration becomes COMPLETED
```

The resulting relationship is:

```text
Solana Mint
     │
     ├──────── Source TX
     │
     ▼
Migration ID
     │
     ├──────── Attestation
     │
     └──────── Destination TX
                       │
                       ▼
                Robinhood Asset
```

---

# Design Philosophy

Pons Doorway follows a simple principle:

> **A bridge moves assets. A doorway moves liquidity.**

The objective is therefore not simply to wrap a Solana token and place a representation on Robinhood Chain.

The Doorway coordinates the complete migration lifecycle:

```text
DISCOVER
   ↓
VERIFY
   ↓
LOCK
   ↓
ATTEST
   ↓
SETTLE
   ↓
LIQUIDITY
```

While `$DOORWAY` provides the economic layer surrounding the infrastructure:

```text
STAKE
   ↓
PARTICIPATE
   ↓
ATTEST
   ↓
SECURE
   ↓
SETTLE
```

Together, these components form the Pons Doorway architecture.

# License

MIT

---

<p align="center">
  <strong>Pons Doorway</strong><br>
  <sub>Carry the liquidity. Keep the bridge.</sub>
</p>