import { createPublicClient, http } from "viem";
import { robinhood, RPC_URL } from "./chain";

export function makeRpcClient() {
  return createPublicClient({
    chain: robinhood,
    transport: http(RPC_URL, {
      timeout: 25_000,
      retryCount: 5,
      retryDelay: 1_200,
    }),
  });
}

export function stringifyBigints(data: unknown) {
  return JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? { __b: value.toString() } : value,
  );
}

export function parseBigints<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (value && typeof value === "object" && Object.keys(value).length === 1 && typeof value.__b === "string") {
      return BigInt(value.__b);
    }
    return value;
  }) as T;
}

export async function withRetries<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /too many requests|429|timeout|rate limit|failed to fetch/i.test(message);
      if (!retryable || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 600 * 2 ** i));
    }
  }
  throw last instanceof Error ? last : new Error("RPC failed");
}
