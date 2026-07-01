import { computePeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';
import { eur, energy } from '@/lib/format';

// Branded 1200×630 SVG card for social scenarios (§11). SVG is broadly embeddable
// and can be rasterised by Make.com's image step if a PNG is required.
const PERIOD_MAP: Record<string, { key: PeriodKey; label: string }> = {
  day: { key: 'yesterday', label: 'Yesterday' },
  week: { key: 'last_week', label: 'Last week' },
  month: { key: 'last_month', label: 'Last month' },
  year: { key: 'last_365', label: 'Last 365 days' },
};

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p = (searchParams.get('period') ?? 'week').toLowerCase();
  const { key, label } = PERIOD_MAP[p] ?? PERIOD_MAP.week;
  const m = computePeriodMetrics(key);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b2545"/>
  <rect x="0" y="0" width="1200" height="8" fill="#2b9fd6"/>
  <text x="70" y="90" fill="#4db8e8" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="700">IRISH GRID</text>
  <text x="70" y="130" fill="#d5e0ee" font-family="Inter,Arial,sans-serif" font-size="20">Clean energy Ireland wasted · ${label}</text>
  <text x="70" y="250" fill="#ffffff" font-family="Inter,Arial,sans-serif" font-size="72" font-weight="800">${energy(m.wastedMwh)}</text>
  <text x="70" y="290" fill="#e06d3b" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="600">dispatched down (wasted)</text>
  <text x="70" y="380" fill="#ffffff" font-family="Inter,Arial,sans-serif" font-size="40" font-weight="700">${eur(m.costEur, { compact: true })}</text>
  <text x="70" y="412" fill="#d5e0ee" font-family="Inter,Arial,sans-serif" font-size="20">cost to billpayers</text>
  <text x="640" y="380" fill="#3bb2a0" font-family="Inter,Arial,sans-serif" font-size="40" font-weight="700">${eur(m.btcValueEur, { compact: true })}</text>
  <text x="640" y="412" fill="#d5e0ee" font-family="Inter,Arial,sans-serif" font-size="20">recoverable via flexible mining</text>
  <text x="70" y="560" fill="#8aa5cb" font-family="Inter,Arial,sans-serif" font-size="18">${m.isEstimate ? 'Modelled estimate' : 'Official annual actual'} · Not financial advice · Independent, not affiliated with EirGrid/SONI</text>
  <text x="70" y="590" fill="#8aa5cb" font-family="Inter,Arial,sans-serif" font-size="18">irishgrid.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
