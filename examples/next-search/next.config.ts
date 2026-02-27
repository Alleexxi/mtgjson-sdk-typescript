import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(import.meta.dirname, "../../"),
  serverExternalPackages: ["@duckdb/node-api", "mtgjson-sdk"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
    ],
  },
};

export default nextConfig;
