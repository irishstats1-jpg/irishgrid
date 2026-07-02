// Custom Worker entrypoint: the OpenNext-generated handler plus a `scheduled`
// handler so the Cron Triggers in wrangler.toml run inside the site's own
// Worker — no separate pinger needed when deployed on Cloudflare.
import handler from './.open-next/worker.js';

export * from './.open-next/worker.js';

export default {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    // 06:15 trigger = daily milestone job; every other firing = hourly refresh.
    const isDaily = event.cron === '15 6 * * *';
    const secret = env.MAKE_SOCIAL_WEBHOOK_SECRET || env.CRON_SECRET;
    const request = new Request(
      `https://irishgrid.com/api/cron/ingest${isDaily ? '?job=daily' : ''}`,
      { method: 'POST', headers: secret ? { authorization: `Bearer ${secret}` } : {} },
    );
    // Route the request through the app handler itself (no external hop).
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
};
