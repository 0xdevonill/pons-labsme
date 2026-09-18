import { parseAbi, parseAbiItem, type Abi } from "viem";
import v1FactoryJson from "./v1Factory.abi.json";

export const v1FactoryAbi = v1FactoryJson as Abi;

export const v1TokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function logo() view returns (string)",
  "function description() view returns (string)",
  "function deployer() view returns (address)",
  "function liquidityPool() view returns (address)",
  "function pairToken() view returns (address)",
  "function poolFee() view returns (uint24)",
  "function restrictionEndBlock() view returns (uint256)",
  "function maxWalletBps() view returns (uint16)",
  "function maxTxBps() view returns (uint16)",
  "function socials() view returns (string twitter, string telegram, string discord, string website, string farcaster)",
  "function getTokenInfo() view returns (address tokenDeployer, string tokenLogo, string tokenDescription, (string twitter, string telegram, string discord, string website, string farcaster) tokenSocials)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const v2FactoryAbi = parseAbi([
  "struct Socials { string twitter; string telegram; string discord; string website; string farcaster; }",
  "struct TokenParams { string name; string symbol; string logo; string description; Socials socials; address creatorFeeRecipient; uint16 creatorTaxBps; bool buybackEnabled; bytes32 expectedEconomics; bytes32 salt; }",
  "struct LaunchConfig { uint256 supply; uint256 curveFeeBps; uint256 phantomQuote; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; bool enabled; }",
  "struct LaunchedToken { address token; address curve; address deployer; address creatorFeeRecipient; address pairToken; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; uint16 creatorTaxBps; bool buybackEnabled; uint8 phase; uint256 sweptQuote; uint256 sweptTokens; uint256 sweptAt; bool exists; }",
  "struct FeePolicySnapshot { address protocolFeeRecipient; uint16 protocolFeeShareBps; uint16 buybackBurnBps; uint16 hookFeeBps; uint16 maxInternalPriceImpactBps; }",
  "function launchToken(TokenParams params, uint256 launchConfigId, address pairToken) payable returns (address token, address curve)",
  "function launchToken(TokenParams params, uint256 launchConfigId, address pairToken, address[] snipeTaxExemptions) payable returns (address token, address curve)",
  "function previewLaunchEconomics(uint256 launchConfigId, address pairToken) view returns (bytes32)",
  "function launchFee() view returns (uint256)",
  "function launchEnabled() view returns (bool)",
  "function canLaunch(address launcher) view returns (bool)",
  "function launchConfigCount() view returns (uint256)",
  "function getLaunchConfig(uint256 id) view returns (LaunchConfig)",
  "function getLaunchedToken(address token) view returns (LaunchedToken)",
  "function getLaunchFeePolicy(address token) view returns (FeePolicySnapshot)",
  "function approvedPairTokens(address pairToken) view returns (bool)",
  "function pairTokenEconomics(address pairToken) view returns (uint256 phantomQuote, uint256 graduationThreshold, uint8 decimals)",
  "function maxCreatorTaxBps() view returns (uint256)",
  "function snipeTaxStartBps() view returns (uint256)",
  "function snipeTaxSeconds() view returns (uint256)",
  "function locker() view returns (address)",
  "function memeHook() view returns (address)",
  "function feeEscrow() view returns (address)",
  "function buybackVault() view returns (address)",
  "function launchDeployer() view returns (address)",
  "function launchForwarder() view returns (address)",
  "function graduate(address token)",
  "function createGraduatedPool(address token) returns (uint256 positionId)",
  "function transferCreatorFeeRecipient(address token, address newRecipient)",
  "function setBuybackEnabled(address token, bool enabled)",
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
  "event LaunchSwept(address indexed token, uint256 quoteOut, uint256 tokenOut)",
  "event PoolGraduated(address indexed token, uint256 positionId, uint256 tokenAmount, uint256 pairTokenAmount)",
]);

export const v2LaunchAndBuyAbi = parseAbi([
  "struct Socials { string twitter; string telegram; string discord; string website; string farcaster; }",
  "struct TokenParams { string name; string symbol; string logo; string description; Socials socials; address creatorFeeRecipient; uint16 creatorTaxBps; bool buybackEnabled; bytes32 expectedEconomics; bytes32 salt; }",
  "function launchAndBuy(TokenParams params, uint256 launchConfigId, address pairToken, uint256 quoteIn, uint256 minTokensOut, address recipient, address[] snipeTaxExemptions) payable returns (address token, address curve, uint256 tokensOut)",
]);

export const v2CurveAbi = parseAbi([
  "function token() view returns (address)",
  "function pairToken() view returns (address)",
  "function isNativeQuote() view returns (bool)",
  "function buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable returns (uint256 tokensOut)",
  "function sell(uint256 tokensIn, uint256 minQuoteOut, address recipient) returns (uint256 quoteOut)",
  "function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)",
  "function quoteReserve() view returns (uint256)",
  "function realQuoteReserve() view returns (uint256)",
  "function tokenReserve() view returns (uint256)",
  "function sellableTokens() view returns (uint256)",
  "function reservedTokens() view returns (uint256)",
  "function readyToGraduate() view returns (bool)",
  "function graduated() view returns (bool)",
  "function graduationThreshold() view returns (uint256)",
  "function phantomQuote() view returns (uint256)",
  "function feeBps() view returns (uint256)",
  "function creatorTaxBps() view returns (uint256)",
  "function buybackEnabled() view returns (bool)",
  "function currentSnipeTaxBps(address recipient) view returns (uint256)",
  "function deployer() view returns (address)",
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)",
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)",
  "event CurveBuyRefunded(address indexed buyer, uint256 refund)",
]);

export const v2TokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function logo() view returns (string)",
  "function description() view returns (string)",
  "function deployer() view returns (address)",
  "function curve() view returns (address)",
  "function launchFactory() view returns (address)",
  "function socials() view returns (string twitter, string telegram, string discord, string website, string farcaster)",
  "function getTokenInfo() view returns (address tokenDeployer, string tokenLogo, string tokenDescription, (string twitter, string telegram, string discord, string website, string farcaster) tokenSocials)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const v2FeeEscrowAbi = parseAbi([
  "function balanceOf(address recipient) view returns (uint256)",
  "function balanceOfToken(address recipient, address token) view returns (uint256)",
  "function claim() returns (uint256 amount)",
  "function claimToken(address token) returns (uint256 amount)",
]);

export const v2BuybackVaultAbi = parseAbi([
  "function totalLocked(address token) view returns (uint256)",
  "function totalReleased(address token) view returns (uint256)",
  "function vestedAmount(address token) view returns (uint256)",
  "function releasable(address token) view returns (uint256)",
  "function vestingStart(address token) view returns (uint256)",
  "function VESTING_DURATION() view returns (uint256)",
  "function release(address token) returns (uint256 released)",
]);

export const swapRouter02Abi = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
]);

export const v2TokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
);

export const v1TokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed deployer, address indexed dexFactory, address pairToken, address pool, uint256 dexId, uint256 launchConfigId, uint256 positionId, uint256 restrictionsEndBlock, uint256 initialBuyAmount)",
);

export const curveBuyEvent = parseAbiItem(
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)",
);

export const curveSellEvent = parseAbiItem(
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)",
);
