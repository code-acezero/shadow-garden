// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://358c3268e1b3af6e9ca520fd5176e2d6@o4510789123833856.ingest.de.sentry.io/4510789124292688";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ✅ FIX: Only enable Sentry in production
Sentry.init({
  dsn: SENTRY_DSN,

  // ✅ CRITICAL: Disable in development
  enabled: IS_PRODUCTION,

  // Performance Monitoring
  tracesSampleRate: IS_PRODUCTION ? 1.0 : 0,

  // Enable logs to be sent to Sentry (only in production)
  enableLogs: IS_PRODUCTION,

  // Enable sending user PII (only in production)
  sendDefaultPii: IS_PRODUCTION,

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
});

// Development logging
if (!IS_PRODUCTION) {
  console.log('🔧 [Sentry Server] Disabled in development mode');
}