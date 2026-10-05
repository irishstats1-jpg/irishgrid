import { ImageResponse } from 'next/og';
import { computePeriodMetrics, refreshLiveData } from '@/lib/data/metrics';
import { eur, energy } from '@/lib/format';
import { approx, btcFigure, methodTag, PERIOD_TAG } from '@/lib/basis';

// Open Graph / Twitter card (Brand Book §06): the paired figure on Paper —
// green first (the waste), orange counterpart (if mined), each with its basis.
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Irish Grid — clean energy Ireland wastes, and what it could recover';

const C = { green: '#169B62', green700: '#0D6440', orange: '#F7931A', orange700: '#9C5306', orange100: '#FEF1E2', ink: '#1D1F20', ink600: '#4F5357', rule: '#D4D6D8', paper: '#F2F2F3', peat: '#062E1D' };

function Mark() {
  // The Ceiling, 48-unit construction (see components/Wordmark.tsx).
  const tops = [30, 12, 5, 15, 26];
  return (
    <svg width="56" height="56" viewBox="0 0 48 48">
      {[5, 13, 21, 29, 37].map((x, i) => {
        const g = Math.max(tops[i], 24.5);
        return [
          tops[i] < 17 ? <rect key={`o${x}`} x={x} y={tops[i]} width="6" height={17 - tops[i]} fill={C.orange} /> : null,
          <rect key={`g${x}`} x={x} y={g} width="6" height={43 - g} fill={C.green} />,
        ];
      })}
      <rect x="2" y="20" width="44" height="1.5" fill={C.ink} />
    </svg>
  );
}

export default async function OgImage() {
  await refreshLiveData();
  const m = computePeriodMetrics('2025');
  const period = PERIOD_TAG['2025'];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.paper, padding: 56, color: C.ink, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Mark />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 3 }}>IRISH GRID</div>
          <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 24, color: C.ink600 }}>Waste less. Pay less. Build more clean energy.</div>
        </div>
        <div style={{ display: 'flex', flex: 1, marginTop: 36, border: `1px solid ${C.rule}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#FFFFFF', padding: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, letterSpacing: 2 }}>
              <div style={{ width: 18, height: 18, background: C.green }} />
              CLEAN ENERGY WASTED
            </div>
            <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: C.green700, marginTop: 18 }}>
              {approx(m)}
              {energy(m.wastedMwh)}
            </div>
            <div style={{ display: 'flex', fontSize: 24, color: C.ink600, marginTop: 'auto' }}>
              {period} · {methodTag(m)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: C.orange100, padding: 40, borderLeft: `1px solid ${C.rule}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, letterSpacing: 2 }}>
              <div style={{ width: 18, height: 18, background: C.orange }} />
              IF THAT SURPLUS HAD MINED BITCOIN†
            </div>
            <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: C.orange700, marginTop: 18 }}>
              ≈ {btcFigure(m.btcMinedNet)}
            </div>
            <div style={{ display: 'flex', fontSize: 24, color: C.ink600, marginTop: 'auto' }}>
              ≈ {eur(m.btcValueEur, { compact: true })} recoverable · † If mined · Modelled
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 22, fontSize: 20, color: C.ink600 }}>
          Independent. No connection to EirGrid or SONI. · † Illustrative, not financial advice. · irishgrid.com
        </div>
      </div>
    ),
    { ...size },
  );
}
