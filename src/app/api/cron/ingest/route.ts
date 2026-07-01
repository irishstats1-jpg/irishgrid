import { NextResponse } from 'next/server';
import { fetchBtcMarket } from '@/lib/data/live';
import { ALL_PERIODS, computePeriodMetrics } from '@/lib/data/metrics';

// Hourly ingestion + recompute (§9). Triggered by a Cloudflare Cron Trigger
// hitting this endpoint with the MAKE_SOCIAL_WEBHOOK_SECRET (reused as a shared
// secret). Idempotent: fetch market → (upsert snapshots) → recompute period
// metrics. In production the recomputed metrics are upserted into period_metrics
// and job_status is updated for the admin health widget.
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const secret = process.env.MAKE_SOCIAL_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured (dev) → allow
  const header = request.headers.get('authorization') ?? request.headers.get('x-cron-secret');
  return header === `Bearer ${secret}` || header === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const market = await fetchBtcMarket();

  // Recompute the live/rolling period metrics.
  const recomputed = ALL_PERIODS.map((p) => {
    const m = computePeriodMetrics(p);
    return { period: p, wastedMwh: Math.round(m.wastedMwh), costEur: Math.round(m.costEur) };
  });

  // TODO (production): upsert generation_snapshots from fetchEirgridArea(...),
  // upsert btc_market/wholesale_prices, upsert period_metrics, set job_status.

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    market: { priceEur: market.priceEur, networkHashrateThs: market.networkHashrateThs },
    recomputed,
  });
}

// Allow manual GET check from the admin without triggering writes.
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, hint: 'POST to run ingestion' });
}
