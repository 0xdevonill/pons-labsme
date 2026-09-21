import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { robinhood, RPC_URL } from "./chain";

const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [robinhood],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    ...(walletConnectId
      ? [
          walletConnect({
            projectId: walletConnectId,
            showQrModal: true,
            metadata: {
              name: "Fons",
              description: "Token launchpad on Robinhood Chain",
              url: "https://ponsfamily.com",
              icons: ["/logo.png"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [robinhood.id]: http(RPC_URL, {
      timeout: 20_000,
      retryCount: 5,
      retryDelay: 1_200,
      batch: true,
    }),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
