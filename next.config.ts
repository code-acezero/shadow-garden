import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: process.env.STANDALONE === "true" ? "standalone" : undefined,
  reactStrictMode: false,
  typescript: {
    // Keep ignoring pre-existing build-time type issues when bundling
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 4,
    workerThreads: false,
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: false },
      path: { browser: false },
      crypto: { browser: false },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/master",
        permanent: true,
      },
      {
        source: "/watchlist",
        destination: "/library",
        permanent: true,
      },
      {
        source: "/hindi-watch/:id",
        destination: "/watch/:id?audio=hi",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
