import { ImageResponse } from 'next/og';
import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { eurModel, gwh, pct } from '@/lib/format';
import { approx, asOfDate, methodTag, periodTag, priceLabel } from '@/lib/basis';
import { COLORS as C, DESCRIPTOR, INDEX_CELLS, INDEX_CELL_SIZE, INDEX_STROKE, INDEX_VIEWBOX } from '@/lib/brand';

// Open Graph / social card (Brand Book v2.0): the paired figure on Paper —
// green first (the waste), orange counterpart, each with its basis.
export const runtime = 'nodejs';
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Irish Grid — wind power Ireland turns away, and what it is worth';

function Mark() {
  const s = INDEX_STROKE;
  return (
    <svg width="56" height="56" viewBox={`0 0 ${INDEX_VIEWBOX} ${INDEX_VIEWBOX}`}>
      {INDEX_CELLS.map((c) =>
        c.kind === 'outline' ? (
          <rect key={`${c.x}-${c.y}`} x={c.x + s / 2} y={c.y + s / 2} width={INDEX_CELL_SIZE - s} height={INDEX_CELL_SIZE - s} fill="none" stroke={C.ink} strokeWidth={s} />
        ) : (
          <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={INDEX_CELL_SIZE} height={INDEX_CELL_SIZE} fill={c.kind === 'orange' ? C.orange : C.green} />
        ),
      )}
    </svg>
  );
}

export default async function OgImage() {
  await refreshLiveData();
  const m = getHeadlineYear();
  const market = getBtcMarket();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.paper, padding: 56, color: C.ink, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Mark />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 38, fontWeight: 700 }}>Irish Grid</div>
            <div style={{ display: 'flex', fontSize: 18, color: C.ink600 }}>{DESCRIPTOR.en}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, marginTop: 32, border: `1px solid ${C.rule}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: C.white, padding: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
              <div style={{ width: 16, height: 16, background: C.green }} />
              Wind power turned away
            </div>
            <div style={{ display: 'flex', fontSize: 100, fontWeight: 800, color: C.greenText, marginTop: 18 }}>
              {approx(m)}
              {gwh(m.windMwh)}
            </div>
            <div style={{ display: 'flex', fontSize: 22, marginTop: 8 }}>
              {m.windPctOfAvailable !== null ? `${pct(m.windPctOfAvailable)} of available wind in Ireland` : 'Ireland'}
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: C.ink600, marginTop: 'auto' }}>
              {periodTag(m)} · {methodTag(m)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: C.orange100, padding: 40, borderLeft: `1px solid ${C.rule}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
              <div style={{ width: 16, height: 16, background: C.orange }} />
              The same energy, mined at today’s network†
            </div>
            <div style={{ display: 'flex', fontSize: 100, fontWeight: 800, color: C.orangeText, marginTop: 18 }}>
              ≈ {eurModel(m.mining.revenue.revenueEur)}
            </div>
            <div style={{ display: 'flex', fontSize: 22, marginTop: 8 }}>Gross revenue, before costs</div>
            <div style={{ display: 'flex', fontSize: 20, color: C.ink600, marginTop: 'auto' }}>
              † {priceLabel(market.priceEur)} per BTC · {asOfDate(market.asOf)} · Modelled
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 18, color: C.ink600 }}>
          Independent and non-partisan. No connection to EirGrid or SONI. † Not financial advice. irishgrid.com
        </div>
      </div>
    ),
    { ...size },
  );
}
