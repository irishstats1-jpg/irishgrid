// 20-year forecast engine (§7.5). A SCENARIO PROJECTION — clearly not a
// prediction. Builds a renewable-capacity trajectory from published anchors,
// scales curtailment with penetration (calibrated to the ROI dispatch-down
// trend), and applies the §7.3 BTC model to estimate per-household savings.

import type { Assumptions, BtcMarket } from './types';
import { computeBtcSavings } from './btc';

/** A single (year) anchor for total installed renewable capacity, GW. */
export interface CapacityAnchor {
  year: number;
  gw: number;
}

export interface ForecastConfig {
  startYear: number;
  endYear: number;
  /** Total renewable-capacity anchors (offshore+onshore+solar), interpolated between. */
  capacityAnchors: CapacityAnchor[];
  /** Scenario pace multiplier applied to capacity above the start year (1 = balanced). */
  pathwayMultiplier: number;
  /** Blended capacity factor GW → annual GWh. */
  capacityFactor: number;
  /** Electricity demand in the start year, GWh. */
  demandStartGwh: number;
  /** Annual demand growth rate (data-centre-led). */
  demandGrowth: number;
  /** Curtailment rate at the reference capacity. */
  curtailmentBaseRate: number;
  /** Total renewable capacity (GW) the base rate is calibrated to. */
  curtailmentRefCapacityGw: number;
  /** Rise in curtailment rate per additional GW of renewable capacity. */
  curtailmentSlopePerGw: number;
  /** Hard cap on the curtailment rate. */
  curtailmentMaxRate: number;
  /** Share of curtailable energy a flexible mining fleet absorbs (0–1). */
  miningAbsorbedShare: number;
}

export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  startYear: 2026,
  endYear: 2046,
  // Published targets: onshore ~9 GW + solar ~8 GW + offshore 5 GW ≈ 22 GW by 2030;
  // offshore 20 GW (2040) and 37 GW (2050) push totals to ~43 and ~63 GW.
  capacityAnchors: [
    { year: 2026, gw: 7 },
    { year: 2030, gw: 22 },
    { year: 2040, gw: 43 },
    { year: 2050, gw: 63 },
  ],
  pathwayMultiplier: 1,
  capacityFactor: 0.3,
  demandStartGwh: 35_000,
  demandGrowth: 0.02,
  curtailmentBaseRate: 0.1, // ROI renewable DD ≈ 8.8% in 2024, trend rising
  curtailmentRefCapacityGw: 6, // ≈ 2024 renewable capacity
  curtailmentSlopePerGw: 0.008,
  curtailmentMaxRate: 0.5,
  miningAbsorbedShare: 0.6,
};

export type Scenario = 'bau' | 'with_mining';

export interface ForecastPoint {
  year: number;
  renewableCapacityGw: number;
  penetrationPct: number;
  renewableGwh: number;
  curtailmentRate: number;
  curtailmentGwh: number;
  /** Energy recovered by mining (0 for BAU). */
  recoveredGwh: number;
  recoveredValueEur: number;
  savingPerHouseholdEur: number;
}

/** Linear interpolation across capacity anchors (extrapolates at the ends). */
export function interpolateCapacity(anchors: CapacityAnchor[], year: number): number {
  const sorted = [...anchors].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return 0;
  if (year <= sorted[0].year) return sorted[0].gw;
  if (year >= sorted[sorted.length - 1].year) return sorted[sorted.length - 1].gw;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return a.gw + t * (b.gw - a.gw);
    }
  }
  return sorted[sorted.length - 1].gw;
}

/** Curtailment rate rises with total renewable capacity, capped. */
export function curtailmentRate(capacityGw: number, cfg: ForecastConfig): number {
  const rate =
    cfg.curtailmentBaseRate +
    cfg.curtailmentSlopePerGw * (capacityGw - cfg.curtailmentRefCapacityGw);
  return Math.max(0, Math.min(cfg.curtailmentMaxRate, rate));
}

export function computeForecast(
  scenario: Scenario,
  cfg: ForecastConfig,
  assumptions: Assumptions,
  market: BtcMarket,
): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const HOURS_PER_YEAR = 8760;

  for (let year = cfg.startYear; year <= cfg.endYear; year++) {
    const baseGw = interpolateCapacity(cfg.capacityAnchors, year);
    // Apply the scenario pace to growth above the start-year level.
    const startGw = interpolateCapacity(cfg.capacityAnchors, cfg.startYear);
    const renewableCapacityGw = startGw + (baseGw - startGw) * cfg.pathwayMultiplier;

    const renewableGwh = renewableCapacityGw * cfg.capacityFactor * HOURS_PER_YEAR;
    const demandGwh =
      cfg.demandStartGwh * Math.pow(1 + cfg.demandGrowth, year - cfg.startYear);
    const penetrationPct = demandGwh > 0 ? (renewableGwh / demandGwh) * 100 : 0;

    const rate = curtailmentRate(renewableCapacityGw, cfg);
    const curtailmentGwh = renewableGwh * rate;

    const recoveredGwh =
      scenario === 'with_mining' ? curtailmentGwh * cfg.miningAbsorbedShare : 0;

    // Feed recovered energy through the BTC model (MWh over one year).
    const btc = computeBtcSavings(recoveredGwh * 1000, HOURS_PER_YEAR, assumptions, market);
    const savingPerHouseholdEur =
      assumptions.nHouseholds > 0 ? btc.valueEur / assumptions.nHouseholds : 0;

    points.push({
      year,
      renewableCapacityGw,
      penetrationPct,
      renewableGwh,
      curtailmentRate: rate,
      curtailmentGwh,
      recoveredGwh,
      recoveredValueEur: btc.valueEur,
      savingPerHouseholdEur,
    });
  }

  return points;
}
