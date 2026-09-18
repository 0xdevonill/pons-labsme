const BPS = 10_000n;

const ceilDiv = (a: bigint, b: bigint) => (b === 0n ? 0n : (a + b - 1n) / b);

export function amountOut(inAmount: bigint, reserveIn: bigint, reserveOut: bigint) {
  if (inAmount === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;
  return (inAmount * reserveOut) / (reserveIn + inAmount);
}

export function amountIn(outAmount: bigint, reserveIn: bigint, reserveOut: bigint) {
  if (outAmount === 0n || reserveOut <= outAmount) return 0n;
  return (outAmount * reserveIn) / (reserveOut - outAmount) + 1n;
}

export function quoteBuy(args: {
  quoteIn: bigint;
  quoteReserve: bigint;
  tokenReserve: bigint;
  sellable: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  snipeBps: bigint;
}) {
  const { quoteIn, quoteReserve, tokenReserve, sellable, feeBps, creatorTaxBps } = args;
  let snipeBps = args.snipeBps;
  if (snipeBps > 0n) {
    const maxSnipeBps = BPS - feeBps - creatorTaxBps - 100n;
    if (snipeBps > maxSnipeBps && maxSnipeBps > 0n) snipeBps = maxSnipeBps;
  }

  let spent = quoteIn;
  const fee = (spent * feeBps) / BPS;
  const tax = (spent * creatorTaxBps) / BPS;
  const snipeTax = (spent * snipeBps) / BPS;
  let tokensOut = amountOut(spent - fee - tax - snipeTax, quoteReserve, tokenReserve);

  if (tokensOut > sellable) {
    tokensOut = sellable;
    const net = amountIn(sellable, quoteReserve, tokenReserve);
    const denom = BPS - feeBps - creatorTaxBps - snipeBps;
    const grossed = denom === 0n ? quoteIn : ceilDiv(net * BPS, denom);
    spent = grossed < quoteIn ? grossed : quoteIn;
  }

  return { tokensOut, spent, refund: quoteIn - spent, fee, tax, snipeTax };
}

export function quoteSell(args: {
  tokensIn: bigint;
  quoteReserve: bigint;
  tokenReserve: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
}) {
  const gross = amountOut(args.tokensIn, args.tokenReserve, args.quoteReserve);
  const fee = (gross * args.feeBps) / BPS;
  const tax = (gross * args.creatorTaxBps) / BPS;
  return { quoteOut: gross - fee - tax, fee, tax };
}

export function graduationProgress(raised: bigint, threshold: bigint) {
  if (threshold === 0n) return 0;
  const pct = Number((raised * 10_000n) / threshold) / 10_000;
  return Math.min(1, pct);
}

export function minOutFromRate(quotedOut: bigint, slippageBps: bigint) {
  return quotedOut - (quotedOut * slippageBps) / BPS;
}
