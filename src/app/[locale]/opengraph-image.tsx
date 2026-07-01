import { ImageResponse } from 'next/og';
import { computePeriodMetrics } from '@/lib/data/metrics';
import { eur, energy } from '@/lib/format';

// Auto-generated Open Graph / Twitter card with the headline figure (§14).
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Irish Grid — clean energy Ireland wastes, and what it costs';

export default async function OgImage() {
  const m = computePeriodMetrics('last_365');
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0b2545',
          color: 'white',
          padding: 70,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#4db8e8', fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>
          IRISH GRID
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#d5e0ee', marginTop: 8 }}>
          Clean energy Ireland wasted · last 365 days
        </div>
        <div style={{ display: 'flex', fontSize: 90, fontWeight: 800, marginTop: 30 }}>{energy(m.wastedMwh)}</div>
        <div style={{ display: 'flex', gap: 60, marginTop: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#e0a03b' }}>{eur(m.costEur, { compact: true })}</span>
            <span style={{ fontSize: 22, color: '#d5e0ee' }}>cost to billpayers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#3bb2a0' }}>{eur(m.btcValueEur, { compact: true })}</span>
            <span style={{ fontSize: 22, color: '#d5e0ee' }}>recoverable via flexible mining</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 18, color: '#8aa5cb', marginTop: 40 }}>
          Modelled · not financial advice · independent, not affiliated with EirGrid/SONI · irishgrid.com
        </div>
      </div>
    ),
    { ...size },
  );
}
