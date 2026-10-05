// Basis labelling (Brand Book §07, "No number without its basis"): every figure
// carries a period tag; method tags say whether it was reported or modelled;
// Bitcoin figures carry "† If mined". "≈" marks rounded or modelled values and
// is never used on a reported total.
import type { TagSpec } from '@/components/ui';
import type { PeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';

export const PERIOD_TAG: Record<PeriodKey, string> = {
  yesterday: 'Yesterday',
  last_week: 'Last 7 days',
  last_month: 'Last 30 days',
  last_365: 'Rolling 365 days',
  '2025': 'Calendar 2025',
  '2024': 'Calendar 2024',
  '2023': 'Calendar 2023',
  '2022': 'Calendar 2022',
};

export function methodTag(m: Pick<PeriodMetrics, 'method' | 'source'>): string {
  if (m.method === 'reported') return `Reported · ${m.source}`;
  if (m.method === 'provisional') return 'Provisional · official report pending';
  return 'Modelled';
}

/** Tags for a dispatch-down volume (the green side). */
export function volumeTags(m: PeriodMetrics): TagSpec[] {
  return [
    { kind: 'period', label: PERIOD_TAG[m.periodKey] },
    { kind: 'method', label: methodTag(m) },
  ];
}

/** Tags for a compensation-cost figure — always modelled from the volume. */
export function costTags(m: PeriodMetrics): TagSpec[] {
  return [
    { kind: 'period', label: PERIOD_TAG[m.periodKey] },
    { kind: 'method', label: 'Modelled' },
  ];
}

/** Tags for the Bitcoin counterpart (the orange side). */
export function btcTags(m: PeriodMetrics): TagSpec[] {
  return [
    { kind: 'mined', label: '† If mined' },
    { kind: 'period', label: PERIOD_TAG[m.periodKey] },
    { kind: 'method', label: 'Modelled · CoinGecko · mempool.space' },
  ];
}

/** "≈ " for anything not reported (§07 rule 3). */
export function approx(m: Pick<PeriodMetrics, 'method'>): string {
  return m.method === 'reported' ? '' : '≈ ';
}

/** BTC count as a figure: whole numbers once large, decimals when small. */
export function btcFigure(n: number): string {
  const digits = n >= 100 ? 0 : n >= 1 ? 1 : 2;
  return `${n.toLocaleString('en-IE', { maximumFractionDigits: digits, minimumFractionDigits: digits })} BTC`;
}

/** Date the BTC price/difficulty were taken, for the † disclaimer. */
export function asOfDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
}
