import { getBtcMarket, getHeadlineYear, getYear, refreshLiveData } from '@/lib/data/metrics';
import { eurModel, gwh, pct } from '@/lib/format';
import { approx, asOfDate, methodTag, periodTag, priceLabel } from '@/lib/basis';
import { COLORS as C, DESCRIPTOR, indexMarkSvg } from '@/lib/brand';

// Branded 1200×630 SVG card (Brand Book v2.0): the paired figure on Paper,
// every number with its basis. ?year=2024; defaults to the latest reported year.
export const revalidate = 3600;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(request: Request) {
  const yearParam = Number(new URL(request.url).searchParams.get('year'));
  await refreshLiveData();
  const m = (Number.isInteger(yearParam) && getYear(yearParam)) || getHeadlineYear();
  const market = getBtcMarket();
  const F = 'Barlow Condensed,Barlow,Arial Narrow,Arial,sans-serif';
  const B = 'Barlow,Arial,sans-serif';
  const pctLine = m.windPctOfAvailable !== null ? `${pct(m.windPctOfAvailable)} of available wind in Ireland` : 'Ireland';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${C.paper}"/>
  ${indexMarkSvg(56, 46, 52)}
  <text x="124" y="80" fill="${C.ink}" font-family="${F}" font-size="38" font-weight="600">Irish Grid</text>
  <text x="124" y="104" fill="${C.ink600}" font-family="${B}" font-size="18">${esc(DESCRIPTOR.en)}</text>
  <rect x="56" y="140" width="544" height="390" fill="${C.white}" stroke="${C.rule}"/>
  <rect x="600" y="140" width="544" height="390" fill="${C.orange100}" stroke="${C.rule}"/>
  <rect x="96" y="180" width="16" height="16" fill="${C.green}"/>
  <text x="124" y="195" fill="${C.ink}" font-family="${F}" font-size="24" letter-spacing="1">Wind power turned away</text>
  <text x="96" y="320" fill="${C.greenText}" font-family="${F}" font-size="104" font-weight="600">${esc(approx(m) + gwh(m.windMwh))}</text>
  <text x="96" y="372" fill="${C.ink}" font-family="${B}" font-size="22">${esc(pctLine)}</text>
  <text x="96" y="500" fill="${C.ink600}" font-family="${B}" font-size="20">${esc(`${periodTag(m)} · ${methodTag(m)}`)}</text>
  <rect x="640" y="180" width="16" height="16" fill="${C.orange}"/>
  <text x="668" y="195" fill="${C.ink}" font-family="${F}" font-size="24" letter-spacing="1">The same energy, mined at today’s network†</text>
  <text x="640" y="320" fill="${C.orangeText}" font-family="${F}" font-size="104" font-weight="600">≈ ${esc(eurModel(m.mining.revenue.revenueEur))}</text>
  <text x="640" y="372" fill="${C.ink}" font-family="${B}" font-size="22">Gross revenue, before costs</text>
  <text x="640" y="500" fill="${C.ink600}" font-family="${B}" font-size="20">${esc(`† ${priceLabel(market.priceEur)} per BTC · ${asOfDate(market.asOf)} · Modelled`)}</text>
  <text x="56" y="580" fill="${C.ink600}" font-family="${B}" font-size="17">Independent and non-partisan. No connection to EirGrid or SONI. † Not financial advice. irishgrid.com/methodology</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
