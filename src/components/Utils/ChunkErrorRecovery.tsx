"use client";

import { useEffect } from "react";

/**
 * ChunkErrorRecovery
 * Automatically catches Webpack ChunkLoadError caused by new deployments,
 * purges stale browser caches, and performs a single safe reload to fetch
 * the latest assets from Vercel.
 */
export default function ChunkErrorRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChunkError = (msg: string) => {
      const isChunk =
        msg.includes("ChunkLoadError") ||
        msg.includes("Loading chunk") ||
        (msg.includes("Failed to load resource") && msg.includes("/_next/static/chunks/")) ||
        msg.includes("missing in chunks");

      if (isChunk) {
        console.warn("[ChunkRecovery] Detected stale chunk failure:", msg);
        const lockKey = "shadow_chunk_reload_lock";
        const last = sessionStorage.getItem(lockKey);
        const now = Date.now();

        // Prevent infinite reload loops (allow at most once every 10 seconds)
        if (!last || now - parseInt(last, 10) > 10000) {
          sessionStorage.setItem(lockKey, now.toString());
          if ("caches" in window) {
            caches.keys().then((keys) => {
              Promise.all(keys.map((k) => caches.delete(k))).finally(() => {
                window.location.href = window.location.pathname + "?t=" + Date.now();
              });
            });
          } else {
            window.location.href = window.location.pathname + "?t=" + Date.now();
          }
        }
      }
    };

    const onError = (event: ErrorEvent) => {
      const msg = event?.message || event?.error?.message || "";
      handleChunkError(msg);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || String(event?.reason || "");
      handleChunkError(msg);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
