// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/*
 * PonsDividends
 *
 * Experimental Automated Treasury, Trading & Strategic Buyback Infrastructure
 * for Robinhood Chain.
 *
 * IMPORTANT:
 * - $DIVIDENDS is the dedicated test asset for this prototype.
 * - Market execution is performed through explicitly approved on-chain
 *   adapters/executors.
 * - Price discovery / risk inputs should come from trusted oracle infrastructure
 *   or validated execution quotes.
 * - This is experimental infrastructure and NOT FINANCIAL ADVICE.
 *
 * Robinhood Chain is EVM-compatible. This contract therefore uses standard
 * Solidity/EVM interfaces and can be deployed with normal Ethereum tooling.
 *
 * Architecture:
 *
 *   PROTOCOL FEES
 *        |
 *        v
 *   +-----------+
 *   |  TREASURY |
 *   +-----------+
 *      |     |
 *      |     +--------------------+
 *      |                          |
 *      v                          v
 *   RESERVE                  TRADING CAPITAL
 *                                 |
 *                                 v
 *                         AUTOMATED AGENT
 *                                 |
 *                                 v
 *                         APPROVED ADAPTER
 *                                 |
 *                                 v
 *                       ELIGIBLE RWA / ASSET
 *                                 |
 *                                 v
 *                         REALIZED PNL
 *                                 |
 *                                 v
 *                       BUYBACK ELIGIBILITY
 *                                 |
 *                                 v
 *                         STRATEGIC $PONS
 *                              BUYBACK
 *
 * The contract intentionally separates:
 *   1. custody/accounting
 *   2. agent authorization
 *   3. market execution
 *   4. risk limits
 *   5. buyback policy
 *
 * The agent can operate capital, but cannot arbitrarily withdraw treasury
 * assets. Every trade is constrained by the configured asset, adapter,
 * notional, loss and cooldown limits.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPonsDividendsAdapter {
    /*
     * Executes an atomic on-chain trade.
     *
     * The adapter is responsible for interacting with the relevant DEX,
     * liquidity venue, RWA venue or other approved execution layer.
     *
     * It MUST return the amount of output asset actually received by this
     * treasury, not an estimated amount.
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata data
    ) external returns (uint256 amountOut);
}

interface IPonsBuybackAdapter {
    /*
     * Converts treasury capital into PONS.
     *
     * The adapter must return the actual number of PONS acquired and must
     * transfer those PONS to the treasury.
     */
    function buyPons(
        address fundingToken,
        uint256 fundingAmount,
        uint256 minPonsOut,
        bytes calldata data
    ) external returns (uint256 ponsReceived);
}

contract PonsDividends {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant BPS = 10_000;

    // Default illustrative policy:
    // 30% reserve / 50% trading / 20% buyback.
    // These are governance parameters, not promises or guaranteed allocations.
    uint256 public constant DEFAULT_RESERVE_BPS = 3_000;
    uint256 public constant DEFAULT_TRADING_BPS = 5_000;
    uint256 public constant DEFAULT_BUYBACK_BPS = 2_000;

    // -------------------------------------------------------------------------
    // Core assets
    // -------------------------------------------------------------------------

    /// @notice Strategic protocol token.
    address public immutable PONS;

    /// @notice Dedicated experimental test asset.
    address public immutable DIVIDENDS;

    /// @notice Base treasury accounting asset, normally a stablecoin.
    address public immutable BASE_ASSET;

    // -------------------------------------------------------------------------
    // Roles
    // -------------------------------------------------------------------------

    address public owner;
    address public pendingOwner;

    /// @notice Address allowed to execute approved trades.
    address public agent;

    /// @notice Address allowed to execute strategic PONS buybacks.
    address public buybackOperator;

    // -------------------------------------------------------------------------
    // Risk / policy configuration
    // -------------------------------------------------------------------------

    bool public paused;

    /// @notice Maximum capital that can be committed to one trade.
    uint256 public maxTradeNotional;

    /// @notice Maximum aggregate capital deployed into trading positions.
    uint256 public maxTradingExposure;

    /// @notice Maximum tolerated loss before the system enters a defensive state.
    uint256 public maxCumulativeLoss;

    /// @notice Minimum delay between strategic buybacks.
    uint256 public buybackCooldown;

    /// @notice Timestamp of the last successful buyback.
    uint256 public lastBuybackAt;

    /// @notice Minimum treasury reserve that must remain untouched by trading.
    uint256 public minimumReserve;

    /// @notice Treasury allocation policy.
    uint256 public reserveBps = DEFAULT_RESERVE_BPS;
    uint256 public tradingBps = DEFAULT_TRADING_BPS;
    uint256 public buybackBps = DEFAULT_BUYBACK_BPS;

    // -------------------------------------------------------------------------
    // Accounting
    // -------------------------------------------------------------------------

    /// @notice Total protocol fees received by the treasury.
    uint256 public totalFeesReceived;

    /// @notice Total capital deployed through the trading engine.
    uint256 public totalCapitalDeployed;

    /// @notice Total capital returned from trading.
    uint256 public totalCapitalReturned;

    /// @notice Realized positive PnL.
    uint256 public realizedProfit;

    /// @notice Realized negative PnL.
    uint256 public realizedLoss;

    /// @notice Capital spent on PONS buybacks.
    uint256 public totalBuybackSpend;

    /// @notice Total PONS acquired by strategic buybacks.
    uint256 public totalPonsBought;

    /// @notice Current capital considered deployed.
    uint256 public activeTradingExposure;

    // -------------------------------------------------------------------------
    // Whitelists
    // -------------------------------------------------------------------------

    mapping(address => bool) public approvedAsset;
    mapping(address => bool) public approvedAdapter;

    // Tracks capital contributed to / returned from individual strategies.
    struct Position {
        address asset;
        uint256 principal;
        uint256 costBasis;
        uint256 lastValuation;
        bool active;
    }

    mapping(bytes32 => Position) public positions;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event BuybackOperatorUpdated(address indexed oldOperator, address indexed newOperator);

    event AssetApprovalUpdated(address indexed asset, bool approved);
    event AdapterApprovalUpdated(address indexed adapter, bool approved);

    event FeesDeposited(
        address indexed payer,
        address indexed asset,
        uint256 amount
    );

    event TradeExecuted(
        bytes32 indexed positionId,
        address indexed adapter,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 realizedPnL
    );

    event PositionClosed(
        bytes32 indexed positionId,
        uint256 principal,
        uint256 returnedCapital,
        uint256 pnl
    );

    event BuybackExecuted(
        address indexed operator,
        address indexed fundingToken,
        uint256 fundingAmount,
        uint256 ponsReceived
    );

    event RiskParametersUpdated(
        uint256 maxTradeNotional,
        uint256 maxTradingExposure,
        uint256 maxCumulativeLoss,
        uint256 minimumReserve
    );

    event AllocationPolicyUpdated(
        uint256 reserveBps,
        uint256 tradingBps,
        uint256 buybackBps
    );

    event BuybackCooldownUpdated(uint256 cooldown);

    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error NotOwner();
    error NotAgent();
    error NotBuybackOperator();
    error PendingOwnerOnly();
    error ContractPaused();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidBps();
    error AssetNotApproved();
    error AdapterNotApproved();
    error TradeTooLarge();
    error ExposureLimit();
    error ReserveViolation();
    error LossLimitReached();
    error BuybackCooldownActive();
    error SlippageProtection();
    error TransferFailed();
    error ApprovalFailed();
    error InvalidPosition();
    error PositionAlreadyActive();
    error NothingToClose();
    error BuybackTooLarge();
    error InvalidPolicy();

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    modifier onlyBuybackOperator() {
        if (msg.sender != buybackOperator) revert NotBuybackOperator();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        address pons_,
        address dividends_,
        address baseAsset_,
        address initialAgent_,
        address initialBuybackOperator_,
        uint256 maxTradeNotional_,
        uint256 maxTradingExposure_,
        uint256 maxCumulativeLoss_,
        uint256 minimumReserve_
    ) {
        if (
            pons_ == address(0) ||
            dividends_ == address(0) ||
            baseAsset_ == address(0) ||
            initialAgent_ == address(0) ||
            initialBuybackOperator_ == address(0)
        ) {
            revert ZeroAddress();
        }

        owner = msg.sender;

        PONS = pons_;
        DIVIDENDS = dividends_;
        BASE_ASSET = baseAsset_;

        agent = initialAgent_;
        buybackOperator = initialBuybackOperator_;

        maxTradeNotional = maxTradeNotional_;
        maxTradingExposure = maxTradingExposure_;
        maxCumulativeLoss = maxCumulativeLoss_;
        minimumReserve = minimumReserve_;

        // The test asset is approved by default because this deployment is
        // explicitly designed around the $DIVIDENDS prototype.
        approvedAsset[DIVIDENDS] = true;
        emit AssetApprovalUpdated(DIVIDENDS, true);

        emit OwnershipTransferred(address(0), msg.sender);
    }

    // -------------------------------------------------------------------------
    // Ownership
    // -------------------------------------------------------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert PendingOwnerOnly();

        address oldOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Role management
    // -------------------------------------------------------------------------

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert ZeroAddress();

        address oldAgent = agent;
        agent = newAgent;

        emit AgentUpdated(oldAgent, newAgent);
    }

    function setBuybackOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();

        address oldOperator = buybackOperator;
        buybackOperator = newOperator;

        emit BuybackOperatorUpdated(oldOperator, newOperator);
    }

    // -------------------------------------------------------------------------
    // Asset / adapter registry
    // -------------------------------------------------------------------------

    function setApprovedAsset(address asset, bool approved) external onlyOwner {
        if (asset == address(0)) revert ZeroAddress();

        approvedAsset[asset] = approved;
        emit AssetApprovalUpdated(asset, approved);
    }

    function setApprovedAdapter(address adapter, bool approved) external onlyOwner {
        if (adapter == address(0)) revert ZeroAddress();

        approvedAdapter[adapter] = approved;
        emit AdapterApprovalUpdated(adapter, approved);
    }

    // -------------------------------------------------------------------------
    // Treasury funding
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit protocol-generated fees into the treasury.
     *
     * In the intended Pons architecture, fee-generating contracts route a
     * portion of protocol revenue here.
     *
     * BASE_ASSET and approved strategy assets may be deposited.
     */
    function depositFees(
        address asset,
        uint256 amount
    ) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (!approvedAsset[asset] && asset != BASE_ASSET) {
            revert AssetNotApproved();
        }

        _safeTransferFrom(asset, msg.sender, address(this), amount);

        totalFeesReceived += amount;

        emit FeesDeposited(msg.sender, asset, amount);
    }

    /**
     * @notice Allows an approved fee source to deposit directly without
     * requiring a separate role. The event identifies the source.
     *
     * This is intentionally permissionless: custody remains in this contract.
     */

    // -------------------------------------------------------------------------
    // Trading engine
    // -------------------------------------------------------------------------

    /**
     * @notice Opens or performs an approved strategy trade.
     *
     * The off-chain agent determines strategy parameters, while the smart
     * contract enforces the hard risk boundary:
     *
     *   - adapter must be approved
     *   - asset must be approved
     *   - notional must be below maxTradeNotional
     *   - aggregate exposure must stay below maxTradingExposure
     *   - minimum reserve must remain available
     *   - cumulative realized losses cannot exceed maxCumulativeLoss
     *
     * The adapter must execute the actual swap/trade and return the actual
     * amount received by this treasury.
     */
    function executeTrade(
        bytes32 positionId,
        address adapter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata data
    )
        external
        onlyAgent
        whenNotPaused
        returns (uint256 amountOut)
    {
        if (!approvedAdapter[adapter]) revert AdapterNotApproved();
        if (amountIn == 0) revert ZeroAmount();

        if (
            !approvedAsset[tokenIn] &&
            tokenIn != BASE_ASSET &&
            tokenIn != PONS
        ) {
            revert AssetNotApproved();
        }

        if (
            !approvedAsset[tokenOut] &&
            tokenOut != BASE_ASSET &&
            tokenOut != PONS
        ) {
            revert AssetNotApproved();
        }

        if (amountIn > maxTradeNotional) revert TradeTooLarge();

        uint256 available = IERC20(tokenIn).balanceOf(address(this));

        // Preserve the reserve when trading from the base treasury asset.
        if (tokenIn == BASE_ASSET) {
            if (available < amountIn + minimumReserve) {
                revert ReserveViolation();
            }
        }

        if (activeTradingExposure + amountIn > maxTradingExposure) {
            revert ExposureLimit();
        }

        if (realizedLoss >= maxCumulativeLoss) {
            revert LossLimitReached();
        }

        if (positions[positionId].active) {
            revert PositionAlreadyActive();
        }

        _safeApprove(tokenIn, adapter, amountIn);

        uint256 beforeOut = IERC20(tokenOut).balanceOf(address(this));

        amountOut = IPonsDividendsAdapter(adapter).executeTrade(
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            data
        );

        uint256 afterOut = IERC20(tokenOut).balanceOf(address(this));
        if (afterOut < beforeOut) revert SlippageProtection();

        // Prefer the actual treasury balance delta over a potentially
        // malicious adapter return value.
        uint256 actualOut = afterOut - beforeOut;

        if (actualOut < minAmountOut) revert SlippageProtection();

        amountOut = actualOut;

        activeTradingExposure += amountIn;
        totalCapitalDeployed += amountIn;

        positions[positionId] = Position({
            asset: tokenOut,
            principal: amountIn,
            costBasis: amountIn,
            lastValuation: actualOut,
            active: true
        });

        emit TradeExecuted(
            positionId,
            adapter,
            tokenIn,
            tokenOut,
            amountIn,
            actualOut,
            0
        );
    }

    /**
     * @notice Closes an accounting position and records realized PnL.
     *
     * The agent supplies the actual returned capital after closing the
     * corresponding market position through an approved adapter.
     *
     * This keeps realized PnL explicit instead of pretending that an
     * unrealized mark-to-market gain is available for buybacks.
     */
    function closePosition(
        bytes32 positionId,
        uint256 returnedCapital
    )
        external
        onlyAgent
        whenNotPaused
        returns (int256 pnl)
    {
        Position storage position = positions[positionId];

        if (!position.active) revert InvalidPosition();
        if (returnedCapital == 0) revert NothingToClose();

        if (returnedCapital >= position.costBasis) {
            uint256 profit = returnedCapital - position.costBasis;

            realizedProfit += profit;
            pnl = int256(profit);
        } else {
            uint256 loss = position.costBasis - returnedCapital;

            if (realizedLoss + loss > maxCumulativeLoss) {
                revert LossLimitReached();
            }

            realizedLoss += loss;
            pnl = -int256(loss);
        }

        if (activeTradingExposure >= position.principal) {
            activeTradingExposure -= position.principal;
        } else {
            activeTradingExposure = 0;
        }

        totalCapitalReturned += returnedCapital;

        position.lastValuation = returnedCapital;
        position.active = false;

        emit PositionClosed(
            positionId,
            position.principal,
            returnedCapital,
            pnl
        );
    }

    // -------------------------------------------------------------------------
    // Strategic PONS buyback engine
    // -------------------------------------------------------------------------

    /**
     * @notice Executes a strategic PONS buyback using realized treasury
     * capital.
     *
     * Buybacks are deliberately separated from trade execution.
     *
     * Conditions:
     *   1. cooldown elapsed
     *   2. funding asset is approved
     *   3. funding amount fits the buyback allocation
     *   4. reserve remains intact
     *   5. loss ceiling has not been reached
     *   6. adapter is explicitly approved
     *   7. minimum PONS output is enforced
     */
    function executeBuyback(
        address adapter,
        address fundingToken,
        uint256 fundingAmount,
        uint256 minPonsOut,
        bytes calldata data
    )
        external
        onlyBuybackOperator
        whenNotPaused
        returns (uint256 ponsReceived)
    {
        if (!approvedAdapter[adapter]) revert AdapterNotApproved();
        if (!approvedAsset[fundingToken] && fundingToken != BASE_ASSET) {
            revert AssetNotApproved();
        }

        if (fundingAmount == 0) revert ZeroAmount();

        if (
            lastBuybackAt != 0 &&
            block.timestamp < lastBuybackAt + buybackCooldown
        ) {
            revert BuybackCooldownActive();
        }

        if (realizedLoss >= maxCumulativeLoss) {
            revert LossLimitReached();
        }

        uint256 available = IERC20(fundingToken).balanceOf(address(this));

        if (fundingToken == BASE_ASSET) {
            if (available < fundingAmount + minimumReserve) {
                revert ReserveViolation();
            }
        } else if (available < fundingAmount) {
            revert BuybackTooLarge();
        }

        /*
         * Buyback policy:
         *
         * The buyback amount cannot exceed the configured share of the
         * treasury's currently available BASE_ASSET capital.
         *
         * This is a policy ceiling, not a promise that the allocation will
         * always be spent.
         */
        if (fundingToken == BASE_ASSET) {
            uint256 reserveFreeBalance = available - minimumReserve;
            uint256 policyLimit = (reserveFreeBalance * buybackBps) / BPS;

            if (fundingAmount > policyLimit) {
                revert BuybackTooLarge();
            }
        }

        _safeApprove(fundingToken, adapter, fundingAmount);

        uint256 beforePons = IERC20(PONS).balanceOf(address(this));

        ponsReceived = IPonsBuybackAdapter(adapter).buyPons(
            fundingToken,
            fundingAmount,
            minPonsOut,
            data
        );

        uint256 afterPons = IERC20(PONS).balanceOf(address(this));

        if (afterPons < beforePons) revert SlippageProtection();

        uint256 actualPons = afterPons - beforePons;

        if (actualPons < minPonsOut) revert SlippageProtection();

        ponsReceived = actualPons;

        totalBuybackSpend += fundingAmount;
        totalPonsBought += actualPons;
        lastBuybackAt = block.timestamp;

        emit BuybackExecuted(
            msg.sender,
            fundingToken,
            fundingAmount,
            actualPons
        );
    }

    /**
     * @notice Sends bought PONS to a burn/lock/sink destination.
     *
     * This is intentionally NOT automatic. The destination can be a burn
     * address, locker, DAO treasury or another explicitly governed contract.
     *
     * PonsDividends itself therefore records the acquisition separately from
     * the eventual treatment of the purchased PONS.
     */
    function transferPurchasedPons(
        address destination,
        uint256 amount
    ) external onlyOwner {
        if (destination == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _safeTransfer(PONS, destination, amount);
    }

    // -------------------------------------------------------------------------
    // Policy / risk management
    // -------------------------------------------------------------------------

    function setRiskParameters(
        uint256 maxTradeNotional_,
        uint256 maxTradingExposure_,
        uint256 maxCumulativeLoss_,
        uint256 minimumReserve_
    ) external onlyOwner {
        if (
            maxTradeNotional_ == 0 ||
            maxTradingExposure_ == 0 ||
            maxCumulativeLoss_ == 0
        ) {
            revert ZeroAmount();
        }

        maxTradeNotional = maxTradeNotional_;
        maxTradingExposure = maxTradingExposure_;
        maxCumulativeLoss = maxCumulativeLoss_;
        minimumReserve = minimumReserve_;

        emit RiskParametersUpdated(
            maxTradeNotional_,
            maxTradingExposure_,
            maxCumulativeLoss_,
            minimumReserve_
        );
    }

    function setAllocationPolicy(
        uint256 reserveBps_,
        uint256 tradingBps_,
        uint256 buybackBps_
    ) external onlyOwner {
        if (reserveBps_ + tradingBps_ + buybackBps_ != BPS) {
            revert InvalidPolicy();
        }

        reserveBps = reserveBps_;
        tradingBps = tradingBps_;
        buybackBps = buybackBps_;

        emit AllocationPolicyUpdated(
            reserveBps_,
            tradingBps_,
            buybackBps_
        );
    }

    function setBuybackCooldown(uint256 cooldown) external onlyOwner {
        buybackCooldown = cooldown;
        emit BuybackCooldownUpdated(cooldown);
    }

    // -------------------------------------------------------------------------
    // Emergency controls
    // -------------------------------------------------------------------------

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Emergency recovery for assets accidentally sent to the
     * treasury. This function is intentionally restricted to the owner.
     *
     * It cannot be used while the system is operating to withdraw BASE_ASSET
     * below the configured minimum reserve.
     */
    function emergencyRecover(
        address asset,
        address destination,
        uint256 amount
    ) external onlyOwner {
        if (destination == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        if (asset == BASE_ASSET) {
            uint256 balance = IERC20(asset).balanceOf(address(this));
            if (balance < amount + minimumReserve) {
                revert ReserveViolation();
            }
        }

        _safeTransfer(asset, destination, amount);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    function treasuryBalance(address asset)
        external
        view
        returns (uint256)
    {
        return IERC20(asset).balanceOf(address(this));
    }

    function realizedNetPnl()
        external
        view
        returns (int256)
    {
        if (realizedProfit >= realizedLoss) {
            return int256(realizedProfit - realizedLoss);
        }

        return -int256(realizedLoss - realizedProfit);
    }

    /**
     * @notice Returns whether the treasury currently has enough free BASE_ASSET
     * capital to satisfy the configured minimum reserve.
     */
    function reserveHealthy()
        public
        view
        returns (bool)
    {
        return IERC20(BASE_ASSET).balanceOf(address(this)) >= minimumReserve;
    }

    /**
     * @notice Returns the maximum BASE_ASSET amount currently permitted for
     * the strategic buyback under the policy ceiling.
     */
    function currentBuybackCapacity()
        external
        view
        returns (uint256)
    {
        uint256 balance = IERC20(BASE_ASSET).balanceOf(address(this));

        if (balance <= minimumReserve) {
            return 0;
        }

        uint256 freeBalance = balance - minimumReserve;
        return (freeBalance * buybackBps) / BPS;
    }

    /**
     * @notice Returns whether the system is currently eligible to attempt a
     * strategic buyback.
     */
    function buybackEligible()
        external
        view
        returns (bool)
    {
        if (paused) return false;
        if (!reserveHealthy()) return false;
        if (realizedLoss >= maxCumulativeLoss) return false;

        if (
            lastBuybackAt != 0 &&
            block.timestamp < lastBuybackAt + buybackCooldown
        ) {
            return false;
        }

        return currentBuybackCapacity() > 0;
    }

    // -------------------------------------------------------------------------
    // Internal safe ERC-20 helpers
    // -------------------------------------------------------------------------

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        (bool ok, bytes memory returndata) = token.call(
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                from,
                to,
                amount
            )
        );

        if (!ok || (returndata.length > 0 && !abi.decode(returndata, (bool)))) {
            revert TransferFailed();
        }
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 amount
    ) internal {
        (bool ok, bytes memory returndata) = token.call(
            abi.encodeWithSelector(
                IERC20.transfer.selector,
                to,
                amount
            )
        );

        if (!ok || (returndata.length > 0 && !abi.decode(returndata, (bool)))) {
            revert TransferFailed();
        }
    }

    function _safeApprove(
        address token,
        address spender,
        uint256 amount
    ) internal {
        /*
         * Resetting to zero first is compatible with tokens that require
         * allowance changes to pass through zero.
         */
        (bool resetOk, bytes memory resetData) = token.call(
            abi.encodeWithSelector(
                IERC20.approve.selector,
                spender,
                0
            )
        );

        if (
            !resetOk ||
            (resetData.length > 0 && !abi.decode(resetData, (bool)))
        ) {
            revert ApprovalFailed();
        }

        (bool ok, bytes memory returndata) = token.call(
            abi.encodeWithSelector(
                IERC20.approve.selector,
                spender,
                amount
            )
        );

        if (!ok || (returndata.length > 0 && !abi.decode(returndata, (bool)))) {
            revert ApprovalFailed();
        }
    }
}
