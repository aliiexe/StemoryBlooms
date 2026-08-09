import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stemory/ui"],
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
