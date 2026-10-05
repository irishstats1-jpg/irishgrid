// Policy briefs. A brief is a dated document: its figures are frozen at the
// publication date (the reported year and the market snapshot it cites), so a
// copy printed later matches the one that was circulated.

import { ANNUAL_DISPATCH_DOWN } from './data/dispatchDown';
import { computeYearMetrics, type YearMetrics } from './data/metrics';
import { FALLBACK_BTC_MARKET } from './methodology';
import type { BtcMarket } from './methodology/types';

export interface Brief {
  no: number;
  slug: string;
  title: string;
  /** Display date, e.g. "October 2026". */
  date: string;
  /** ISO date of publication. */
  published: string;
  standfirst: string;
}

export const BRIEFS: Brief[] = [
  {
    no: 1,
    slug: '1',
    title: 'Paying twice for clean power',
    date: 'October 2026',
    published: '2026-10-05',
    standfirst:
      'Electricity customers help fund Ireland’s wind farms, then pay again when the grid cannot take their power. In 2024 the grid turned away 1,266 GWh of wind in Ireland — one unit in ten of what was available. This brief sets out the evidence, a modelled cost, and three options that would let flexible demand use the surplus at no cost to the public.',
  },
];

export function getBrief(slug: string): Brief | undefined {
  return BRIEFS.find((b) => b.slug === slug);
}

/** The figures Brief No. 1 cites: calendar 2024, market snapshot of 4 October 2026. */
export function briefOneFigures(): { year: YearMetrics; series: YearMetrics[]; market: BtcMarket } {
  const market = FALLBACK_BTC_MARKET;
  const series = ANNUAL_DISPATCH_DOWN.filter((d) => d.year >= 2021 && d.year <= 2025).map((d) =>
    computeYearMetrics(d, market),
  );
  const year = series.find((m) => m.year === 2024)!;
  return { year, series, market };
}
