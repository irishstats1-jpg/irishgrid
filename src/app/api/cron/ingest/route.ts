import { NextResponse } from 'next/server';
import { getAllYears, getBtcMarket, refreshLiveData } from '@/lib/data/metrics';
import { purgeExpired } from '@/lib/integrations';

// Hourly refresh. Triggered by a Cloudflare Cron Trigger with CRON_SECRET (or
// MAKE_SOCIAL_WEBHOOK_SECRET). Idempotent: refresh the market snapshot and the
// annual series, recompute the annual figures, and report what was used. The
// daily run (?job=daily) also deletes data past its retention period.
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  // Accept either our shared secret or Vercel Cron's CRON_SECRET bearer.
  const secrets = [process.env.MAKE_SOCIAL_WEBHOOK_SECRET, process.env.CRON_SECRET].filter(
    Boolean,
  ) as string[];
  // No secret configured: allowed only in local development; production fails closed.
  if (secrets.length === 0) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('authorization') ?? request.headers.get('x-cron-secret') ?? '';
  return secrets.some((s) => header === `Bearer ${s}` || header === s);
}

async function runIngest(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get('job') ?? 'hourly';

  await refreshLiveData();
  const market = getBtcMarket();

  const purged = job === 'daily' ? await purgeExpired() : undefined;

  const recomputed = getAllYears().map((m) => ({
    year: m.year,
    method: m.method,
    windGwh: Math.round(m.windMwh / 1000),
    costCentralEur: Math.round(m.cost.central),
    grossRevenueEur: Math.round(m.mining.revenue.revenueEur),
  }));

  return NextResponse.json({
    ok: true,
    job,
    ranAt: new Date().toISOString(),
    market: {
      priceEur: market.priceEur,
      networkHashrateThs: market.networkHashrateThs,
      asOf: market.asOf,
      live: market.live,
    },
    recomputed,
    ...(purged !== undefined ? { purged } : {}),
  });
}

// Cron schedulers (Vercel Cron, Cloudflare) send GET; Make/manual can POST.
export const GET = runIngest;
export const POST = runIngest;
