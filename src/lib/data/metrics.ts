// Annual figures for every page, chart, card and export. One series (Ireland,
// wind, calendar years — see dispatchDown.ts), one denominator (private
// households) and a cost RANGE, never a single invented precision.
//
// The headline is the latest REPORTED year. A provisional year is shown, but
// labelled, and never leads.

import type { BtcMarket, PeriodKey } from '../methodology/types';
import {
  computeCostRange,
  computeMiningEconomics,
  computeReplacementCost,
  COST_CASES,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_MINING_COSTS,
  FALLBACK_BTC_MARKET,
  WHOLESALE_REF_EUR_PER_MWH,
  type Assumptions,
  type CostRange,
  type MiningEconomics,
} from '../methodology';
import { ANNUAL_DISPATCH_DOWN, HOUSEHOLDS, type AnnualDispatchDown, type DataMethod } from './dispatchDown';
import { fetchBtcMarket } from './live';

export type FigureMethod = DataMethod;

export interface YearMetrics {
  periodKey: PeriodKey;
  year: number;
  method: DataMethod;
  /** Short label for basis tags, e.g. "EirGrid C&C report 2024". */
  source: string;
  sourceTitle: string;
  sourceUrl: string;
  notes: string;
  /** Wind dispatch-down in Ireland, MWh. */
  windMwh: number;
  /** Dispatch-down as % of available wind, as reported. */
  windPctOfAvailable: number | null;
  /** Constraint share used for the central cost case (0–1). */
  constraintShare: number;
  /** True when the split comes from the report rather than an assumption. */
  constraintShareReported: boolean;
  constraintMwh: number;
  curtailmentMwh: number;
  /** Modelled compensation paid to generators, low / central / high, €. */
  cost: CostRange;
  /** The same, per private household (Census 2022), €. */
  costPerHousehold: CostRange;
  /** Context only: wholesale value of the CONSTRAINED volume replaced elsewhere, €. */
  replacementCostEur: number;
  /** Gross and net mining economics of that volume at the current market snapshot. */
  mining: MiningEconomics;
}

export function computeYearMetrics(
  d: AnnualDispatchDown,
  market: BtcMarket,
  assumptions: Assumptions = DEFAULT_ASSUMPTIONS,
): YearMetrics {
  const windMwh = d.windGwh * 1000;
  const constraintShare = d.constraintShare ?? COST_CASES.central.defaultConstraintShare;
  const constraintMwh = windMwh * constraintShare;
  const cost = computeCostRange(windMwh, d.constraintShare);
  const perHousehold = (v: number) => v / HOUSEHOLDS.count;
  return {
    periodKey: String(d.year) as PeriodKey,
    year: d.year,
    method: d.method,
    source: d.source,
    sourceTitle: d.sourceTitle,
    sourceUrl: d.sourceUrl,
    notes: d.notes,
    windMwh,
    windPctOfAvailable: d.windPctOfAvailable,
    constraintShare,
    constraintShareReported: d.constraintShare !== null,
    constraintMwh,
    curtailmentMwh: windMwh - constraintMwh,
    cost,
    costPerHousehold: { low: perHousehold(cost.low), central: perHousehold(cost.central), high: perHousehold(cost.high) },
    replacementCostEur: computeReplacementCost(constraintMwh, WHOLESALE_REF_EUR_PER_MWH),
    mining: computeMiningEconomics(windMwh, assumptions, market, DEFAULT_MINING_COSTS),
  };
}

/**
 * Merge database rows into the reviewed seeds. A row may only fill a year that
 * is missing from the seeds or marked provisional there, and only if the row
 * itself is a reported figure — so a bad write can never overwrite a reported
 * number on the site.
 */
export function mergeAnnual(seeds: AnnualDispatchDown[], rows: AnnualDispatchDown[]): AnnualDispatchDown[] {
  const byYear = new Map(seeds.map((s) => [s.year, s]));
  for (const r of rows) {
    if (r.method !== 'reported') continue;
    const seed = byYear.get(r.year);
    if (seed && seed.method === 'reported') continue;
    byYear.set(r.year, r);
  }
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

// ---- Live inputs ---------------------------------------------------------------
// Module state, refreshed at most hourly per isolate. Both sources fall back to
// the dated seeds; pages show which one is in use.

const TTL_MS = 60 * 60 * 1000;
let _market: BtcMarket = { ...FALLBACK_BTC_MARKET };
let _marketAt = 0;
let _annual: AnnualDispatchDown[] = ANNUAL_DISPATCH_DOWN;
let _annualAt = 0;

function rowToAnnual(r: Record<string, unknown>): AnnualDispatchDown | null {
  const year = Number(r.year);
  const gwh = Number(r.gwh);
  if (!Number.isInteger(year) || !(gwh > 0)) return null;
  const constraint = Number(r.constraint_gwh);
  const pct = r.wind_pct === null || r.wind_pct === undefined ? null : Number(r.wind_pct);
  const source = String(r.source ?? '');
  return {
    year,
    method: r.method === 'reported' ? 'reported' : 'provisional',
    windGwh: gwh,
    windPctOfAvailable: pct !== null && Number.isFinite(pct) ? pct : null,
    constraintShare: constraint > 0 && constraint <= gwh ? constraint / gwh : null,
    source,
    sourceTitle: source,
    sourceUrl: String(r.source_url ?? ''),
    notes: String(r.notes ?? ''),
  };
}

async function fetchAnnualFromSupabase(): Promise<AnnualDispatchDown[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/dispatch_down_actuals?select=*&region=eq.ROI&order=year.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows)) return null;
    return rows.map(rowToAnnual).filter((r): r is AnnualDispatchDown => r !== null);
  } catch {
    return null;
  }
}

/** Refresh live inputs (call from server components and route handlers). */
export async function refreshLiveData(): Promise<void> {
  const now = Date.now();
  const tasks: Promise<void>[] = [];
  if (now - _marketAt > TTL_MS) {
    tasks.push(
      fetchBtcMarket().then((m) => {
        _market = m ?? { ...FALLBACK_BTC_MARKET };
        _marketAt = now;
      }),
    );
  }
  if (now - _annualAt > TTL_MS) {
    tasks.push(
      fetchAnnualFromSupabase().then((rows) => {
        _annual = rows && rows.length ? mergeAnnual(ANNUAL_DISPATCH_DOWN, rows) : ANNUAL_DISPATCH_DOWN;
        _annualAt = now;
      }),
    );
  }
  await Promise.all(tasks);
}

export function getAssumptions(): Assumptions {
  return { ...DEFAULT_ASSUMPTIONS };
}

export function getBtcMarket(): BtcMarket {
  return { ..._market };
}

/** All years, newest first. */
export function getAllYears(): YearMetrics[] {
  const market = getBtcMarket();
  return _annual.map((d) => computeYearMetrics(d, market)).sort((a, b) => b.year - a.year);
}

export function getYear(year: number): YearMetrics | undefined {
  return getAllYears().find((y) => y.year === year);
}

/** The latest year with a REPORTED figure — the only year a headline uses. */
export function getHeadlineYear(): YearMetrics {
  const years = getAllYears();
  return years.find((y) => y.method === 'reported') ?? years[0];
}
