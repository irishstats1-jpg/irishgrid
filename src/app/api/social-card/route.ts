import { computePeriodMetrics, refreshLiveData } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';
import { eur, energy } from '@/lib/format';
import { approx, btcFigure, methodTag, PERIOD_TAG } from '@/lib/basis';

// Branded 1200×630 SVG card for social scenarios (§11). SVG is broadly embeddable
// and can be rasterised by Make.com's image step if a PNG is required.
const PERIOD_MAP: Record<string, PeriodKey> = {
  day: 'yesterday',
  week: 'last_week',
  month: 'last_month',
  year: 'last_365',
  '2025': '2025',
};

export const revalidate = 3600;

// The Ceiling mark (48-unit construction, see components/Wordmark.tsx) as SVG.
function mark(x: number, y: number, s: number): string {
  const tops = [30, 12, 5, 15, 26];
  const bars = [5, 13, 21, 29, 37]
    .map((bx, i) => {
      const g = Math.max(tops[i], 24.5);
      const o = tops[i] < 17 ? `<rect x="${bx}" y="${tops[i]}" width="6" height="${17 - tops[i]}" fill="#F7931A"/>` : '';
      return `${o}<rect x="${bx}" y="${g}" width="6" height="${43 - g}" fill="#169B62"/>`;
    })
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${s / 48})">${bars}<rect x="2" y="20" width="44" height="1.5" fill="#1D1F20"/></g>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p = (searchParams.get('period') ?? 'week').toLowerCase();
  const key = PERIOD_MAP[p] ?? PERIOD_MAP.week;
  await refreshLiveData();
  const m = computePeriodMetrics(key);
  const F = 'Barlow Condensed,Barlow,Arial Narrow,Arial,sans-serif';

  // Brand Book §06/§07: the paired figure on Paper, every number with its basis.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F2F2F3"/>
  ${mark(56, 44, 56)}
  <text x="128" y="84" fill="#1D1F20" font-family="${F}" font-size="34" font-weight="600" letter-spacing="2">IRISH GRID</text>
  <text x="1144" y="84" text-anchor="end" fill="#4F5357" font-family="${F}" font-size="24">Waste less. Pay less. Build more clean energy.</text>
  <rect x="56" y="130" width="544" height="400" fill="#FFFFFF" stroke="#D4D6D8"/>
  <rect x="600" y="130" width="544" height="400" fill="#FEF1E2" stroke="#D4D6D8"/>
  <rect x="96" y="172" width="18" height="18" fill="#169B62"/>
  <text x="126" y="189" fill="#1D1F20" font-family="${F}" font-size="24" letter-spacing="2">CLEAN ENERGY WASTED</text>
  <text x="96" y="320" fill="#0D6440" font-family="${F}" font-size="104" font-weight="600">${approx(m)}${energy(m.wastedMwh)}</text>
  <text x="96" y="490" fill="#4F5357" font-family="${F}" font-size="24">${PERIOD_TAG[key]} · ${methodTag(m)}</text>
  <rect x="640" y="172" width="18" height="18" fill="#F7931A"/>
  <text x="670" y="189" fill="#1D1F20" font-family="${F}" font-size="24" letter-spacing="2">IF THAT SURPLUS HAD MINED BITCOIN†</text>
  <text x="640" y="320" fill="#9C5306" font-family="${F}" font-size="104" font-weight="600">≈ ${btcFigure(m.btcMinedNet)}</text>
  <text x="640" y="490" fill="#4F5357" font-family="${F}" font-size="24">≈ ${eur(m.btcValueEur, { compact: true })} recoverable · † If mined · Modelled</text>
  <text x="56" y="584" fill="#4F5357" font-family="${F}" font-size="20">Independent. No connection to EirGrid or SONI. · † Illustrative, not financial advice. · irishgrid.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
