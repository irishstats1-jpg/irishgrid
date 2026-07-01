import { NextResponse } from 'next/server';
import { computePeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';

// Endpoint consumed by Make.com scenarios (§11). Returns the period's figures:
// source mix, wasted-energy cost, and the amount that could have been saved via
// BTC (total + per billpayer). Map friendly period names to internal keys.
const PERIOD_MAP: Record<string, PeriodKey> = {
  day: 'yesterday',
  yesterday: 'yesterday',
  week: 'last_week',
  month: 'last_month',
  year: 'last_365',
};

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodParam = (searchParams.get('period') ?? 'week').toLowerCase();
  const periodKey = PERIOD_MAP[periodParam] ?? 'last_week';
  const m = computePeriodMetrics(periodKey);

  return NextResponse.json({
    period: periodParam,
    isEstimate: m.isEstimate,
    producedMwh: Math.round(m.producedMwh),
    wastedMwh: Math.round(m.wastedMwh),
    sourceBreakdown: m.sourceBreakdown,
    costEur: Math.round(m.costEur),
    costPerBillpayerEur: Number(m.costPerBillpayerEur.toFixed(2)),
    btcValueEur: Math.round(m.btcValueEur),
    btcMinedNet: Number(m.btcMinedNet.toFixed(2)),
    savingPerBillpayerEur: Number(m.savingPerBillpayerEur.toFixed(2)),
    cardUrl: `/api/social-card?period=${periodParam}`,
    computedAt: m.computedAt,
    disclaimer: 'Modelled figures. Not financial advice. Independent; not affiliated with EirGrid or SONI.',
  });
}
