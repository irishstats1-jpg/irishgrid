import type { BtcMarket, FuelType, PeriodKey } from '../methodology/types';
import {
  DEFAULT_ASSUMPTIONS,
  FALLBACK_BTC_MARKET,
  PERIOD_HOURS,
  computeBtcSavings,
  computeCost,
  DEFAULT_COST_ASSUMPTIONS,
  type Assumptions,
} from '../methodology';
import { buildYearSeries, type DaySeriesPoint } from './series';
import {
  ANNUAL_GENERATION_GWH,
  DISPATCH_DOWN_ACTUALS,
  type DispatchDownActual,
} from './dispatchDown';
import { GENERATORS } from './generators';
import { fetchBtcMarket } from './live';

const FUELS: FuelType[] = ['wind', 'solar', 'gas', 'hydro', 'coal', 'oil', 'other', 'imports'];

export interface PeriodMetrics {
  periodKey: PeriodKey;
  isEstimate: boolean;
  producedMwh: number;
  wastedMwh: number;
  curtailmentMwh?: number;
  constraintMwh?: number;
  sourceBreakdown: Record<FuelType, number>; // MWh by fuel
  costEur: number;
  costPerBillpayerEur: number;
  costPerPersonEur: number;
  btcValueEur: number;
  btcMinedNet: number;
  savingPerBillpayerEur: number;
  savingPerPersonEur: number;
  periodHours: number;
  computedAt: string;
}

// ---- Live context (auto-updating) --------------------------------------------
// Module-level state refreshed via refreshLiveData(): the BTC market comes from
// CoinGecko/mempool (Next fetch cache, ~hourly) and dispatch-down actuals from
// the Supabase `dispatch_down_actuals` table when configured. Both fall back to
// the in-repo seeds, so nothing breaks when a source is unreachable.

let _market: BtcMarket = { ...FALLBACK_BTC_MARKET };
let _actuals: DispatchDownActual[] = DISPATCH_DOWN_ACTUALS;

async function fetchActualsFromSupabase(): Promise<DispatchDownActual[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/dispatch_down_actuals?select=*&order=year.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map((r) => ({
      year: Number(r.year),
      region: 'ROI' as const,
      source: String(r.source ?? ''),
      gwh: Number(r.gwh ?? 0),
      curtailmentGwh: Number(r.curtailment_gwh ?? 0),
      constraintGwh: Number(r.constraint_gwh ?? 0),
      windDispatchDownPct: 0,
      notes: String(r.notes ?? ''),
    }));
  } catch {
    return null;
  }
}

/**
 * Refresh the live inputs (call from server components / route handlers before
 * computing metrics). Safe to call often — underlying fetches are cached.
 */
export async function refreshLiveData(): Promise<void> {
  const [market, actuals] = await Promise.all([fetchBtcMarket(), fetchActualsFromSupabase()]);
  _market = market;
  if (actuals) {
    // DB rows override seeds per-year; seeds fill any missing years.
    const byYear = new Map<number, DispatchDownActual>();
    for (const a of DISPATCH_DOWN_ACTUALS) byYear.set(a.year, a);
    for (const a of actuals) byYear.set(a.year, a);
    _actuals = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }
}

export function getAssumptions(): Assumptions {
  return { ...DEFAULT_ASSUMPTIONS };
}

export function getBtcMarket(): BtcMarket {
  return { ..._market };
}

function getActual(year: number): DispatchDownActual | undefined {
  return _actuals.find((a) => a.year === year);
}

// Reference "now" is fixed to today's date so SSR is deterministic per day.
function referenceDate(): Date {
  return new Date();
}

let _series: DaySeriesPoint[] | null = null;
export function getSeries(): DaySeriesPoint[] {
  if (!_series) _series = buildYearSeries(referenceDate());
  return _series;
}

function sliceForPeriod(periodKey: PeriodKey): DaySeriesPoint[] {
  const s = getSeries();
  switch (periodKey) {
    case 'yesterday':
      return s.slice(-1);
    case 'last_week':
      return s.slice(-7);
    case 'last_month':
      return s.slice(-30);
    case 'last_365':
      return s;
    default:
      return s; // year keys handled separately
  }
}

const YEAR_KEYS = new Set<PeriodKey>(['2022', '2023', '2024', '2025']);

/** Compute (and would-cache) metrics for a duration key. */
export function computePeriodMetrics(periodKey: PeriodKey): PeriodMetrics {
  const assumptions = getAssumptions();
  const market = getBtcMarket();
  const periodHours = PERIOD_HOURS[periodKey] ?? 24 * 7;
  const denominators = { nBillpayers: assumptions.nBillpayers, nPeople: assumptions.nPeople };

  if (YEAR_KEYS.has(periodKey)) {
    // ---- Official annual actuals (§7.1) ----
    const year = Number(periodKey);
    const actual = getActual(year);
    const producedGwh = ANNUAL_GENERATION_GWH[year] ?? 33_000;
    const wastedMwh = (actual?.gwh ?? 0) * 1000;
    const curtailmentMwh = actual ? actual.curtailmentGwh * 1000 : undefined;
    const constraintMwh = actual ? actual.constraintGwh * 1000 : undefined;

    const cost = computeCost(
      { totalMwh: wastedMwh, curtailmentMwh, constraintMwh },
      DEFAULT_COST_ASSUMPTIONS,
      denominators,
    );
    const btc = computeBtcSavings(wastedMwh, periodHours, assumptions, market);

    return {
      periodKey,
      isEstimate: false,
      producedMwh: producedGwh * 1000,
      wastedMwh,
      curtailmentMwh,
      constraintMwh,
      sourceBreakdown: annualBreakdown(producedGwh * 1000),
      costEur: cost.costEur,
      costPerBillpayerEur: cost.costPerBillpayerEur,
      costPerPersonEur: cost.costPerPersonEur,
      btcValueEur: btc.valueEur,
      btcMinedNet: btc.btcMinedNet,
      savingPerBillpayerEur: btc.savingPerBillpayerEur,
      savingPerPersonEur: btc.savingPerPersonEur,
      periodHours,
      computedAt: new Date().toISOString(),
    };
  }

  // ---- Modelled estimates from the synthetic/live series (§7.1) ----
  const slice = sliceForPeriod(periodKey);
  const breakdown = emptyBreakdown();
  let producedMwh = 0;
  let wastedMwh = 0;
  for (const d of slice) {
    for (const f of FUELS) {
      breakdown[f] += d.produced[f];
      producedMwh += d.produced[f];
    }
    wastedMwh += Math.max(0, d.windAvailableMwh - d.produced.wind);
  }

  const cost = computeCost({ totalMwh: wastedMwh }, DEFAULT_COST_ASSUMPTIONS, denominators);
  const hours = slice.length * 24;
  const btc = computeBtcSavings(wastedMwh, hours, assumptions, market);

  return {
    periodKey,
    isEstimate: true,
    producedMwh,
    wastedMwh,
    sourceBreakdown: breakdown,
    costEur: cost.costEur,
    costPerBillpayerEur: cost.costPerBillpayerEur,
    costPerPersonEur: cost.costPerPersonEur,
    btcValueEur: btc.valueEur,
    btcMinedNet: btc.btcMinedNet,
    savingPerBillpayerEur: btc.savingPerBillpayerEur,
    savingPerPersonEur: btc.savingPerPersonEur,
    periodHours: hours,
    computedAt: new Date().toISOString(),
  };
}

/** Fuel-mix time-series for charts (daily points; year keys return a stub). */
export function getFuelMixSeries(periodKey: PeriodKey) {
  if (YEAR_KEYS.has(periodKey)) return [];
  return sliceForPeriod(periodKey).map((d) => ({
    date: d.date,
    ...d.produced,
    wasted: Math.max(0, d.windAvailableMwh - d.produced.wind),
  }));
}

/**
 * Modelled live output for a single generator (§5.1 data note). EirGrid
 * publishes live fuel mix at SYSTEM level, not per plant — so each plant's
 * output is estimated by pro-rating its fuel type's system generation across
 * installed capacity. Always labelled "estimated" on-site.
 */
export function getGeneratorModelledOutput(generatorId: string, periodKey: PeriodKey) {
  const gen = GENERATORS.find((g) => g.id === generatorId);
  if (!gen) return null;
  const metrics = computePeriodMetrics(periodKey);
  const fuelSystemMwh = metrics.sourceBreakdown[gen.fuelType] ?? 0;

  const fuelInstalledMw = GENERATORS
    .filter((g) => g.fuelType === gen.fuelType)
    .reduce((sum, g) => sum + g.capacityMw, 0);

  const share = fuelInstalledMw > 0 ? gen.capacityMw / fuelInstalledMw : 0;
  const modelledOutputMwh = fuelSystemMwh * share;

  // Wasted energy attributable to this plant (wind only in the estimate model).
  const attributableWastedMwh = gen.fuelType === 'wind' ? metrics.wastedMwh * share : 0;

  return {
    generator: gen,
    modelledOutputMwh,
    attributableWastedMwh,
    isEstimate: true,
  };
}

function emptyBreakdown(): Record<FuelType, number> {
  return { wind: 0, solar: 0, gas: 0, hydro: 0, coal: 0, oil: 0, other: 0, imports: 0 };
}

// Rough annual fuel-mix shares for year views (produced total → breakdown).
function annualBreakdown(totalMwh: number): Record<FuelType, number> {
  const shares: Record<FuelType, number> = {
    wind: 0.34,
    gas: 0.42,
    solar: 0.03,
    hydro: 0.02,
    coal: 0.05,
    oil: 0.01,
    other: 0.03,
    imports: 0.1,
  };
  const out = emptyBreakdown();
  for (const f of FUELS) out[f] = Math.round(totalMwh * shares[f]);
  return out;
}

export const ALL_PERIODS: PeriodKey[] = [
  'yesterday',
  'last_week',
  'last_month',
  'last_365',
  '2025',
  '2024',
  '2023',
  '2022',
];
