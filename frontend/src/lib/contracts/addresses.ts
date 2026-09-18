import type { Address } from "viem";

/** Live Robinhood Chain deployments. Do not change these addresses. */
export const V1_FACTORY = "0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB" as const satisfies Address;
export const V1_LOCKER = "0x736d76699c26d0d966744cae304c000d471f7f35" as const satisfies Address;
export const V1_V3_FACTORY = "0x1f7d7550b1b028f7571e69a784071f0205fd2efa" as const satisfies Address;
export const V1_POSITION_MANAGER = "0x73991a25c818bf1f1128deaab1492d45638de0d3" as const satisfies Address;
export const V1_SWAP_ROUTER = "0xcaf681a66d020601342297493863e78c959e5cb2" as const satisfies Address;
export const V1_DEFAULT_PAIR = "0x0bd7d308f8e1639fab988df18a8011f41eacad73" as const satisfies Address;

export const V2_FACTORY = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e" as const satisfies Address;
export const V2_LAUNCH_AND_BUY = "0xe33E9E479dF8802cb0866d5d05258bEc4cF62948" as const satisfies Address;
export const V2_LAUNCH_DEPLOYER = "0x3711ceA4feaDE896C913C68F01Eda97Cb06D1A42" as const satisfies Address;
export const V2_MEME_HOOK = "0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044" as const satisfies Address;
export const V2_FEE_ESCROW = "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e" as const satisfies Address;
export const V2_BUYBACK_VAULT = "0x42df2a798f82289E177311362e8f5ccC45c1219c" as const satisfies Address;
export const V2_LOCKER = "0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952" as const satisfies Address;
export const V2_GRADUATION_EXECUTOR = "0xC7819B64A1dAECD7eC19856d026cb14EfBd89046" as const satisfies Address;
export const V2_GRADUATION_GUARD = "0xf5695117b99B6f6401e67d4195BD653628176C6C" as const satisfies Address;
export const V4_POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951" as const satisfies Address;
export const V4_POSITION_MANAGER = "0x58daec3116aae6d93017baaea7749052e8a04fa7" as const satisfies Address;
export const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3" as const satisfies Address;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const satisfies Address;

export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";

export const KNOWN_PAIR_TOKENS = [
  { symbol: "ETH", address: ZERO_ADDRESS, decimals: 18 },
  { symbol: "USDG", address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168" as Address, decimals: 6 },
  { symbol: "AAPL", address: "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9" as Address, decimals: 18 },
  { symbol: "AMD", address: "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc" as Address, decimals: 18 },
  { symbol: "AMZN", address: "0x12f190a9f9d7d37a250758b26824b97ce941bf54" as Address, decimals: 18 },
  { symbol: "COIN", address: "0x6330d8c3178a418788df01a47479c0ce7ccf450b" as Address, decimals: 18 },
  { symbol: "CRCL", address: "0xdf0992e440dd0be65bd8439b609d6d4366bf1cb5" as Address, decimals: 18 },
  { symbol: "GME", address: "0x1b0e319c6a659f002271b69db8a7df2f911c153e" as Address, decimals: 18 },
  { symbol: "GOOGL", address: "0x2e0847e8910a9732eb3fb1bb4b70a580adad4fe3" as Address, decimals: 18 },
  { symbol: "META", address: "0xc0d6457c16cc70d6790dd43521c899c87ce02f35" as Address, decimals: 18 },
  { symbol: "MSFT", address: "0xe93237c50d904957cf27e7b1133b510c669c2e74" as Address, decimals: 18 },
  { symbol: "MU", address: "0xff080c8ce2e5feadaca0da81314ae59d232d4afd" as Address, decimals: 18 },
  { symbol: "NVDA", address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec" as Address, decimals: 18 },
  { symbol: "PLTR", address: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a" as Address, decimals: 18 },
  { symbol: "SNDK", address: "0xb90a19ff0af67f7779aff50a882a9cff42446400" as Address, decimals: 18 },
  { symbol: "SPCX", address: "0x4a0e65a3eccec6dbe60ae065f2e7bb85fae35eea" as Address, decimals: 18 },
  { symbol: "SPY", address: "0x117cc2133c37b721f49de2a7a74833232b3b4c0c" as Address, decimals: 18 },
  { symbol: "TSLA", address: "0x322f0929c4625ed5bad873c95208d54e1c003b2d" as Address, decimals: 18 },
  { symbol: "WETH", address: V1_DEFAULT_PAIR, decimals: 18 },
] as const;

export function pairSymbol(address: Address | undefined) {
  if (!address || address === ZERO_ADDRESS) return "ETH";
  const found = KNOWN_PAIR_TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
  return found?.symbol ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function pairDecimals(address: Address | undefined) {
  if (!address || address === ZERO_ADDRESS) return 18;
  const found = KNOWN_PAIR_TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
  return found?.decimals ?? 18;
}

export function explorerToken(address: Address) {
  return `${EXPLORER_URL}/token/${address}`;
}

export function explorerTx(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddress(address: Address) {
  return `${EXPLORER_URL}/address/${address}`;
}
