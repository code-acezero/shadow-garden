import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Add this to ignore type errors during build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Add this to fix the @consumet/extensions issue
  transpilePackages: ['@consumet/extensions'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        vm: false,
        child_process: false,
      };
      
      config.externals.push({
        "node:vm": "commonjs vm",
      });
    }

    // Fix for "punycode" warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ];

    // Exclude @consumet/extensions from problematic bundling
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('@consumet/extensions');
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);