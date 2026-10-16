export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Enable fallback to public DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1)
    // to protect against local router/ISP DNS resolution failures on CDNs
    try {
      const dns = await import('node:dns');
      dns.setDefaultResultOrder?.('ipv4first');
      try {
        dns.setServers?.(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
      } catch {}
      console.log('[Instrumentation] Enhanced Node.js DNS with public fallback servers (8.8.8.8, 1.1.1.1)');
    } catch (e) {
      console.warn('[Instrumentation] Could not configure DNS fallback:', e);
    }

    const SIX_HOURS = 6 * 60 * 60 * 1000;

    console.log("[Instrumentation] Registering 6-hour Oracle Cron Job for Node.js server...");

    // Run initial Oracle check 1 minute after server boots
    setTimeout(async () => {
      try {
        const { checkAllLibraryUpdates } = await import('@/lib/oracle-runner');
        await checkAllLibraryUpdates();
      } catch (err) {
        console.error('[Instrumentation] Initial Oracle Run Error:', err);
      }
    }, 60 * 1000);

    // Schedule automated Oracle check every 6 hours
    setInterval(async () => {
      try {
        const { checkAllLibraryUpdates } = await import('@/lib/oracle-runner');
        await checkAllLibraryUpdates();
      } catch (err) {
        console.error('[Instrumentation] Scheduled Oracle Run Error:', err);
      }
    }, SIX_HOURS);
  }
}
