import {
  type Address,
  type Hash,
  type PublicClient,
  decodeEventLog,
} from "viem";
import {
  V1_FACTORY,
  V2_FACTORY,
} from "./contracts/addresses";
import {
  v1TokenLaunchedEvent,
  v2TokenLaunchedEvent,
} from "./contracts/abis";
import type { Generation, LaunchRecord } from "./types";

export const DEFAULT_LOOKBACK = BigInt(
  process.env.NEXT_PUBLIC_LOG_LOOKBACK ?? "100000",
);

function asLaunchV2(
  log: {
    args: {
      token: Address;
      curve: Address;
      deployer: Address;
      pairToken: Address;
      launchConfigId: bigint;
      graduationThreshold: bigint;
    };
    blockNumber: bigint;
    transactionHash: `0x${string}`;
  },
): LaunchRecord {
  return {
    generation: "v2",
    token: log.args.token,
    curve: log.args.curve,
    deployer: log.args.deployer,
    pairToken: log.args.pairToken,
    launchConfigId: log.args.launchConfigId,
    graduationThreshold: log.args.graduationThreshold,
    blockNumber: log.blockNumber,
    txHash: log.transactionHash,
  };
}

export async function fetchLaunchLogs(
  client: PublicClient,
  opts: {
    generation?: Generation | "all";
    fromBlock: bigint;
    toBlock: bigint;
    deployer?: Address;
  },
): Promise<LaunchRecord[]> {
  const generation = opts.generation ?? "all";
  const jobs: Array<Promise<LaunchRecord[]>> = [];

  if (generation === "all" || generation === "v2") {
    jobs.push(
      client
        .getLogs({
          address: V2_FACTORY,
          event: v2TokenLaunchedEvent,
          args: opts.deployer ? { deployer: opts.deployer } : undefined,
          fromBlock: opts.fromBlock,
          toBlock: opts.toBlock,
        })
        .then((logs) =>
          logs.map((log) =>
            asLaunchV2({
              args: log.args as LaunchRecord extends never
                ? never
                : {
                    token: Address;
                    curve: Address;
                    deployer: Address;
                    pairToken: Address;
                    launchConfigId: bigint;
                    graduationThreshold: bigint;
                  },
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            }),
          ),
        ),
    );
  }

  if (generation === "all" || generation === "v1") {
    jobs.push(
      client
        .getLogs({
          address: V1_FACTORY,
          event: v1TokenLaunchedEvent,
          args: opts.deployer ? { deployer: opts.deployer } : undefined,
          fromBlock: opts.fromBlock,
          toBlock: opts.toBlock,
        })
        .then((logs) =>
          logs.map((log) => {
            const args = log.args as {
              token: Address;
              deployer: Address;
              dexFactory: Address;
              pairToken: Address;
              pool: Address;
              launchConfigId: bigint;
            };
            return {
              generation: "v1" as const,
              token: args.token,
              deployer: args.deployer,
              pairToken: args.pairToken,
              launchConfigId: args.launchConfigId,
              pool: args.pool,
              dexFactory: args.dexFactory,
              blockNumber: log.blockNumber,
              txHash: log.transactionHash,
            };
          }),
        ),
    );
  }

  const groups = await Promise.all(jobs);
  const merged = groups.flat();
  const seen = new Set<string>();
  return merged
    .filter((item) => {
      const key = item.token.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.blockNumber - a.blockNumber));
}

export type SerializedLaunch = Omit<LaunchRecord, "launchConfigId" | "graduationThreshold" | "blockNumber"> & {
  launchConfigId: string;
  graduationThreshold?: string;
  blockNumber: string;
};

export function serializeLaunch(item: LaunchRecord): SerializedLaunch {
  return {
    ...item,
    launchConfigId: item.launchConfigId.toString(),
    graduationThreshold: item.graduationThreshold?.toString(),
    blockNumber: item.blockNumber.toString(),
  };
}

export function parseLaunchRecord(raw: SerializedLaunch): LaunchRecord {
  return {
    generation: raw.generation,
    token: raw.token,
    curve: raw.curve,
    deployer: raw.deployer,
    pairToken: raw.pairToken,
    launchConfigId: BigInt(raw.launchConfigId),
    graduationThreshold:
      raw.graduationThreshold != null && raw.graduationThreshold !== ""
        ? BigInt(raw.graduationThreshold)
        : undefined,
    pool: raw.pool,
    dexFactory: raw.dexFactory,
    blockNumber: BigInt(raw.blockNumber),
    txHash: raw.txHash as Hash,
  };
}

export async function fetchWindow(
  client: PublicClient,
  lookback: bigint,
  extra?: { generation?: Generation | "all"; deployer?: Address },
) {
  const latest = await client.getBlockNumber();
  const fromBlock = latest > lookback ? latest - lookback : 0n;
  const launches = await fetchLaunchLogs(client, {
    fromBlock,
    toBlock: latest,
    ...extra,
  });
  return { launches, fromBlock, toBlock: latest };
}

/** Decode a raw TokenLaunched log if a client returns undecoded logs. */
export function decodeLaunchLog(log: {
  address: Address;
  data: `0x${string}`;
  topics: [] | [`0x${string}`, ...`0x${string}`[]];
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}): LaunchRecord | null {
  try {
    if (log.address.toLowerCase() === V2_FACTORY.toLowerCase()) {
      const decoded = decodeEventLog({
        abi: [v2TokenLaunchedEvent],
        data: log.data,
        topics: log.topics,
      });
      return asLaunchV2({
        args: decoded.args as never,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      });
    }
    if (log.address.toLowerCase() === V1_FACTORY.toLowerCase()) {
      const decoded = decodeEventLog({
        abi: [v1TokenLaunchedEvent],
        data: log.data,
        topics: log.topics,
      });
      const args = decoded.args as {
        token: Address;
        deployer: Address;
        dexFactory: Address;
        pairToken: Address;
        pool: Address;
        launchConfigId: bigint;
      };
      return {
        generation: "v1",
        token: args.token,
        deployer: args.deployer,
        pairToken: args.pairToken,
        launchConfigId: args.launchConfigId,
        pool: args.pool,
        dexFactory: args.dexFactory,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      };
    }
  } catch {
    return null;
  }
  return null;
}
