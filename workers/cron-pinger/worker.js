// Irish Grid — cron pinger (free Cloudflare Worker).
//
// Vercel's free tier only allows daily cron, but Cloudflare's free Workers plan
// includes Cron Triggers as often as every minute. This Worker runs on your
// existing (free) Cloudflare account and pings the site's ingest endpoint so
// data refreshes hourly, plus the daily milestone job — and warms the key pages
// so visitors always get freshly-revalidated figures.
//
// Setup (all in the browser — see DEPLOY.md "Hourly auto-updates"):
//   1. dash.cloudflare.com → Workers & Pages → Create → Worker → paste this file
//   2. Settings → Variables: SITE_URL = https://irishgrid.com (plain)
//                            CRON_SECRET = <same value as in Vercel> (encrypt)
//   3. Settings → Triggers → Cron Triggers: add "0 * * * *" and "15 6 * * *"

export default {
  async scheduled(event, env, ctx) {
    const base = (env.SITE_URL || 'https://irishgrid.com').replace(/\/$/, '');
    const headers = env.CRON_SECRET ? { authorization: `Bearer ${env.CRON_SECRET}` } : {};

    // The 06:15 trigger runs the daily job (milestone detection); every other
    // firing is the hourly refresh.
    const isDaily = event.cron === '15 6 * * *';
    const ingest = `${base}/api/cron/ingest${isDaily ? '?job=daily' : ''}`;

    // Warm the high-traffic pages so ISR re-renders them with fresh data even
    // when no visitor has hit them since the last revalidation window.
    const warm = ['/', '/curtailment', '/proposal', '/ga'].map((p) =>
      fetch(`${base}${p}`, { headers: { 'user-agent': 'irishgrid-cron-pinger' } }).catch(() => {}),
    );

    ctx.waitUntil(
      Promise.allSettled([fetch(ingest, { method: 'POST', headers }), ...warm]),
    );
  },
};
