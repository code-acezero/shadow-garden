import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

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

// ✅ FIX: Disable Sentry webpack plugin in development
const sentryWebpackPluginOptions = {
  org: "shadow-garden-ou",
  project: "javascript-nextjs",
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // ✅ CRITICAL FIX: Disable Sentry completely in development
  dryRun: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);