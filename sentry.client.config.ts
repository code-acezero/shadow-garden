// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://358c3268e1b3af6e9ca520fd5176e2d6@o4510789123833856.ingest.de.sentry.io/4510789124292688";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ✅ CRITICAL FIX: Only initialize Sentry in production
if (IS_PRODUCTION) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII
    sendDefaultPii: true,

    // Environment
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'production',

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
} else {
  // Development mode - log to console instead
  console.log('🔧 [Sentry] Disabled in development mode');
  console.log('💡 Errors will be logged to console only');
  
  // Optional: You can still log errors to console in dev
  window.addEventListener('error', (event) => {
    console.error('🚨 [Dev Error]:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 [Dev Unhandled Rejection]:', event.reason);
  });
}
