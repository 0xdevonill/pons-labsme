import { PLATFORM_FEE } from "./brand";

export function platformFeeDue(factoryFee: bigint | undefined) {
  const onchain = factoryFee ?? 0n;
  const extra = PLATFORM_FEE > onchain ? PLATFORM_FEE - onchain : 0n;
  return {
    platform: PLATFORM_FEE,
    factory: onchain,
    extra,
  };
}
