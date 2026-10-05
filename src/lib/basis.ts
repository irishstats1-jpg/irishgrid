// Basis labelling (Brand Book v2.0, evidence rules): every figure carries a
// period tag; method tags say whether it was reported or modelled; modelled
// values carry "≈"; Bitcoin figures carry † plus the BTC price and date.
import type { TagSpec } from '@/components/ui';
import type { YearMetrics } from '@/lib/data/metrics';
import type { BtcMarket } from '@/lib/methodology/types';

type Basis = Pick<YearMetrics, 'year' | 'method' | 'source'>;

export function periodTag(m: Pick<YearMetrics, 'year'>): string {
  return `Calendar ${m.year}`;
}

export function methodTag(m: Basis): string {
  if (m.method === 'reported') return `Reported · ${m.source}`;
  return 'Provisional · official report pending';
}

/** Tags for a dispatch-down volume (the green side). */
export function volumeTags(m: Basis): TagSpec[] {
  return [
    { kind: 'period', label: periodTag(m) },
    { kind: 'scope', label: 'Ireland · wind' },
    { kind: 'method', label: methodTag(m) },
  ];
}

/** Tags for a compensation-cost figure — always modelled, always a range. */
export function costTags(m: Basis): TagSpec[] {
  return [
    { kind: 'period', label: periodTag(m) },
    { kind: 'method', label: 'Modelled · range' },
  ];
}

/** Tags for a Bitcoin figure (the orange side): † with the price and date used. */
export function btcTags(market: BtcMarket): TagSpec[] {
  const tags: TagSpec[] = [
    { kind: 'mined', label: `† ${priceLabel(market.priceEur)} · ${asOfDate(market.asOf)}` },
    { kind: 'method', label: 'Modelled · gross, before costs' },
  ];
  if (!market.live) tags.push({ kind: 'scope', label: 'Stored snapshot' });
  return tags;
}

/** "≈ " for anything not reported (evidence rule 2). */
export function approx(m: Pick<YearMetrics, 'method'>): string {
  return m.method === 'reported' ? '' : '≈ ';
}

/** BTC count as a figure, two significant figures (it is modelled). */
export function btcFigure(n: number): string {
  if (n >= 100) {
    const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
    return `${(Math.round(n / p) * p).toLocaleString('en-IE')} BTC`;
  }
  return `${n.toLocaleString('en-IE', { maximumSignificantDigits: 2 })} BTC`;
}

export function priceLabel(eur: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Math.round(eur / 100) * 100,
  );
}

/** Date a market snapshot was taken, e.g. "4 October 2026" (UTC, so server and browser agree). */
export function asOfDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
