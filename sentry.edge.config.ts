// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://358c3268e1b3af6e9ca520fd5176e2d6@o4510789123833856.ingest.de.sentry.io/4510789124292688";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
});