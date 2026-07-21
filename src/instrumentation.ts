export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
