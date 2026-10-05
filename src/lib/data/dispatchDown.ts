// Annual dispatch-down figures — the evidence the whole site rests on.
//
// Scope: Republic of Ireland, WIND ONLY, calendar years, from the annual
// Renewable Energy Constraint and Curtailment reports published jointly by
// EirGrid and SONI. One series is used everywhere (Brand Book v2.0, evidence
// rule 3): solar is excluded so 2022–2024 are like-for-like.
//
// These seeds are the reviewed source of truth for REPORTED years: a database
// row can only fill a year that is missing here or marked provisional
// (see refreshLiveData in metrics.ts). Changing a reported figure therefore
// needs a code change, which leaves an audit trail in git.

export type DataMethod = 'reported' | 'provisional';

export interface AnnualDispatchDown {
  year: number;
  method: DataMethod;
  /** Wind dispatch-down in the Republic of Ireland, GWh. */
  windGwh: number;
  /** Dispatch-down as a share of available wind energy, %. */
  windPctOfAvailable: number | null;
  /** Share of wind dispatch-down caused by (local) constraint rather than (system-wide) curtailment, 0–1; null when not reported. */
  constraintShare: number | null;
  /** Short label for basis tags. */
  source: string;
  /** Full citation. */
  sourceTitle: string;
  sourceUrl: string;
  notes: string;
}

const REPORT = (year: number, published: string, file = `Annual-Renewable-Constraint-and-Curtailment-Report-${year}-V1.0.pdf`) => ({
  source: `EirGrid C&C report ${year}`,
  sourceTitle: `EirGrid & SONI, Annual Renewable Energy Constraint and Curtailment Report ${year} (${published})`,
  sourceUrl: `https://cms.eirgrid.ie/sites/default/files/publications/${file}`,
});

export const ANNUAL_DISPATCH_DOWN: AnnualDispatchDown[] = [
  {
    year: 2020,
    method: 'reported',
    windGwh: 1448,
    windPctOfAvailable: 11.4,
    constraintShare: null,
    ...REPORT(2020, 'May 2021', 'Annual-Renewable-Constraint-and-Curtailment-Report-2020.pdf'),
    notes: 'Covid-19 lockdowns cut demand in 2020, which raised dispatch-down; the report notes this.',
  },
  {
    year: 2021,
    method: 'reported',
    windGwh: 752,
    windPctOfAvailable: 7.3,
    constraintShare: null,
    ...REPORT(2021, 'August 2022'),
    notes: 'Curtailment/constraint split for Ireland not captured here; cost uses the assumed split.',
  },
  {
    year: 2022,
    method: 'reported',
    windGwh: 988,
    windPctOfAvailable: 8.3,
    constraintShare: null,
    ...REPORT(2022, 'May 2023'),
    notes: 'Curtailment/constraint split for Ireland not captured here; cost uses the assumed split.',
  },
  {
    year: 2023,
    method: 'reported',
    windGwh: 1124,
    windPctOfAvailable: 8.9,
    constraintShare: null,
    ...REPORT(2023, 'April 2024'),
    notes: 'Curtailment/constraint split for Ireland not captured here; cost uses the assumed split.',
  },
  {
    year: 2024,
    method: 'reported',
    windGwh: 1266,
    windPctOfAvailable: 10.1,
    constraintShare: 0.5,
    ...REPORT(2024, 'April 2025'),
    notes: 'The report states dispatch-down in Ireland was roughly equally due to curtailment and constraint.',
  },
  {
    year: 2025,
    method: 'provisional',
    windGwh: 1500,
    windPctOfAvailable: 11.3,
    constraintShare: 6.6 / 11.3,
    source: 'Preliminary 2025 rates',
    sourceTitle:
      'Preliminary 2025 wind dispatch-down rates for Ireland (11.3% of available wind: constraint 6.6%, curtailment 4.7%), as reported by Climate Jargon Buster; volume estimated by Irish Grid pending the official 2025 report',
    sourceUrl: 'https://climatejargonbuster.ie/kb/curtailment/',
    notes: 'Volume (≈1,500 GWh) is Irish Grid’s estimate. Replace with the official report figure when it is published.',
  },
];

/** All-island wind dispatch-down (Ireland + Northern Ireland), % of available wind. */
export const ALL_ISLAND_WIND_PCT = [
  { year: 2020, pct: 12.1 },
  { year: 2021, pct: 7.4 },
  { year: 2022, pct: 8.5 },
  { year: 2023, pct: 10.7 },
  { year: 2024, pct: 14.0 },
] as const;

/** One denominator site-wide: private households, Census 2022. */
export const HOUSEHOLDS = {
  count: 1_841_152,
  label: 'private households (Census 2022)',
  source: 'CSO, Census of Population 2022, Profile 3 — Households, Families and Childcare',
  sourceUrl:
    'https://www.cso.ie/en/releasesandpublications/ep/p-cpp3/censusofpopulation2022profile3-householdsfamiliesandchildcare/keyfindings/',
} as const;
