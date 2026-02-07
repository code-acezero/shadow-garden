import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Keeps UI libs stable
  eslint: {
    // Warning: This allows production builds to successfully complete 
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // 1. Fix for "node:vm" and other Node modules crashing client builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        vm: false, // Fixes "node:vm" error
        child_process: false,
      };
      
      // Explicitly tell Webpack to ignore "node:" prefixed modules on client
      config.externals.push({
        "node:vm": "commonjs vm",
      });
    }

    // 2. Fix for "punycode" warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ];

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);