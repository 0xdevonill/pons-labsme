import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "*.mypinata.cloud" },
      { protocol: "https", hostname: "w3s.link" },
      { protocol: "https", hostname: "dweb.link" },
      { protocol: "https", hostname: "nftstorage.link" },
      { protocol: "https", hostname: "arweave.net" },
    ],
  },
};

export default nextConfig;
