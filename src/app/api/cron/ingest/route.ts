import { NextResponse } from 'next/server';
import { fetchBtcMarket } from '@/lib/data/live';
import { ALL_PERIODS, computePeriodMetrics, getSeries } from '@/lib/data/metrics';

// Daily milestone detection (§9): flag a new record-waste day so a social draft
// can be created. Returns the milestone (in production it writes a social_posts
// draft/trigger for Make).
function detectMilestone() {
  const series = getSeries();
  if (series.length < 2) return null;
  const today = series[series.length - 1];
  const todayWasted = Math.max(0, today.windAvailableMwh - today.produced.wind);
  const priorMax = Math.max(
    ...series.slice(0, -1).map((d) => Math.max(0, d.windAvailableMwh - d.produced.wind)),
  );
  if (todayWasted > priorMax) {
    return { type: 'record_waste_day', date: today.date, wastedMwh: Math.round(todayWasted) };
  }
  return null;
}

// Hourly ingestion + recompute (§9). Triggered by a Cloudflare Cron Trigger
// hitting this endpoint with the MAKE_SOCIAL_WEBHOOK_SECRET (reused as a shared
// secret). Idempotent: fetch market → (upsert snapshots) → recompute period
// metrics. In production the recomputed metrics are upserted into period_metrics
// and job_status is updated for the admin health widget.
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  // Accept either our shared secret or Vercel Cron's CRON_SECRET bearer.
  const secrets = [process.env.MAKE_SOCIAL_WEBHOOK_SECRET, process.env.CRON_SECRET].filter(
    Boolean,
  ) as string[];
  if (secrets.length === 0) return true; // no secret configured (dev) → allow
  const header = request.headers.get('authorization') ?? request.headers.get('x-cron-secret') ?? '';
  return secrets.some((s) => header === `Bearer ${s}` || header === s);
}

async function runIngest(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get('job') ?? 'hourly';

  const market = await fetchBtcMarket();

  // Recompute the live/rolling period metrics.
  const recomputed = ALL_PERIODS.map((p) => {
    const m = computePeriodMetrics(p);
    return { period: p, wastedMwh: Math.round(m.wastedMwh), costEur: Math.round(m.costEur) };
  });

  // Daily run additionally runs milestone detection.
  const milestone = job === 'daily' ? detectMilestone() : null;

  // TODO (production): upsert generation_snapshots from fetchEirgridArea(...),
  // upsert btc_market/wholesale_prices, upsert period_metrics, set job_status;
  // if milestone, insert a social_posts draft for Make.

  return NextResponse.json({
    ok: true,
    job,
    ranAt: new Date().toISOString(),
    market: { priceEur: market.priceEur, networkHashrateThs: market.networkHashrateThs },
    recomputed,
    milestone,
  });
}

// Cron schedulers (Vercel Cron, Cloudflare) send GET; Make/manual can POST.
export const GET = runIngest;
export const POST = runIngest;
