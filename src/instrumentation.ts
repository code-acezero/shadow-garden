export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Enable fallback to Cloudflare DoH & resilient dispatcher for all server-side fetch calls
    // Protects against ISP UDP 53 blocking and CDN DNS resolution failures
    try {
      const { setGlobalDispatcher } = await import('undici');
      const { resilientDispatcher } = await import('@/app/api/proxy/fetchWithCustomReferer');
      setGlobalDispatcher(resilientDispatcher);
      console.log('[Instrumentation] Global Undici dispatcher armed with Cloudflare DoH resilience');
    } catch (e) {
      console.warn('[Instrumentation] Could not configure global dispatcher:', e);
    }
  }
}
