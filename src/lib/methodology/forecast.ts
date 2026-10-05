// 20-year scenario engine. A SCENARIO, not a prediction: renewable capacity
// follows published targets, dispatch-down rises with capacity on a
// business-as-usual grid, and — in the flexible-demand scenario — a share of
// the surplus is used by flexible load. Bitcoin revenue follows the halving
// schedule and a growing network, so later years earn far less per MWh.

import type { Assumptions, BtcMarket } from './types';
import { averageBlockReward, HOURS_PER_YEAR } from './constants';
import { computeMiningRevenue } from './btc';

export interface CapacityAnchor {
  year: number;
  gw: number;
}

export interface ForecastConfig {
  startYear: number;
  endYear: number;
  /** Installed renewable capacity anchors (onshore + offshore + solar), GW. */
  capacityAnchors: CapacityAnchor[];
  /** Pace multiplier on growth above the start year (1 = published targets). */
  pathwayMultiplier: number;
  capacityFactor: number;
  /** Dispatch-down rate at the reference capacity (2024 Ireland wind: 10.1%). */
  dispatchDownBaseRate: number;
  curtailmentRefCapacityGw: number;
  /** Rise in the dispatch-down rate per additional GW on a business-as-usual grid. */
  dispatchDownSlopePerGw: number;
  dispatchDownMaxRate: number;
  /** Share of the surplus the flexible fleet uses (0–1). */
  flexibleAbsorbedShare: number;
  /** Annual growth of the Bitcoin network hashrate (0.15 = 15%/yr). */
  networkGrowth: number;
  /** Annual change in the BTC price in euro (0 = flat). */
  priceGrowth: number;
}

export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  startYear: 2026,
  endYear: 2046,
  // Published targets: ~22 GW of renewables by 2030 (onshore ~9, solar ~8,
  // offshore 5); offshore 20 GW by 2040 and 37 GW by 2050.
  capacityAnchors: [
    { year: 2026, gw: 7 },
    { year: 2030, gw: 22 },
    { year: 2040, gw: 43 },
    { year: 2050, gw: 63 },
  ],
  pathwayMultiplier: 1,
  // Blended across the 2030 mix (onshore ≈ 0.28, solar ≈ 0.11, offshore ≈ 0.40).
  capacityFactor: 0.25,
  dispatchDownBaseRate: 0.101,
  curtailmentRefCapacityGw: 6,
  dispatchDownSlopePerGw: 0.008,
  dispatchDownMaxRate: 0.5,
  flexibleAbsorbedShare: 0.6,
  networkGrowth: 0.15,
  priceGrowth: 0,
};

export type Scenario = 'bau' | 'with_flexible_demand';

export interface ForecastPoint {
  year: number;
  renewableCapacityGw: number;
  renewableGwh: number;
  dispatchDownRate: number;
  dispatchDownGwh: number;
  /** Surplus energy used by flexible demand (0 in business as usual). */
  absorbedGwh: number;
  blockRewardBtc: number;
  /** Gross Bitcoin revenue from the absorbed energy, before costs. */
  grossRevenueEur: number;
}

export function interpolateCapacity(anchors: CapacityAnchor[], year: number): number {
  const sorted = [...anchors].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return 0;
  if (year <= sorted[0].year) return sorted[0].gw;
  if (year >= sorted[sorted.length - 1].year) return sorted[sorted.length - 1].gw;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (year >= a.year && year <= b.year) return a.gw + ((year - a.year) / (b.year - a.year)) * (b.gw - a.gw);
  }
  return sorted[sorted.length - 1].gw;
}

export function dispatchDownRate(capacityGw: number, cfg: ForecastConfig): number {
  const rate = cfg.dispatchDownBaseRate + cfg.dispatchDownSlopePerGw * (capacityGw - cfg.curtailmentRefCapacityGw);
  return Math.max(0, Math.min(cfg.dispatchDownMaxRate, rate));
}

export function computeForecast(
  scenario: Scenario,
  cfg: ForecastConfig,
  assumptions: Assumptions,
  market: BtcMarket,
): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const startGw = interpolateCapacity(cfg.capacityAnchors, cfg.startYear);
  for (let year = cfg.startYear; year <= cfg.endYear; year++) {
    const baseGw = interpolateCapacity(cfg.capacityAnchors, year);
    const renewableCapacityGw = startGw + (baseGw - startGw) * cfg.pathwayMultiplier;
    const renewableGwh = renewableCapacityGw * cfg.capacityFactor * HOURS_PER_YEAR;
    const rate = dispatchDownRate(renewableCapacityGw, cfg);
    const dispatchDownGwh = renewableGwh * rate;
    const absorbedGwh = scenario === 'with_flexible_demand' ? dispatchDownGwh * cfg.flexibleAbsorbedShare : 0;

    const t = year - cfg.startYear;
    const blockRewardBtc = averageBlockReward(year);
    const yearMarket: BtcMarket = {
      ...market,
      blockRewardBtc,
      networkHashrateThs: market.networkHashrateThs * Math.pow(1 + cfg.networkGrowth, t),
      priceEur: market.priceEur * Math.pow(1 + cfg.priceGrowth, t),
    };
    const revenue = computeMiningRevenue(absorbedGwh * 1000, HOURS_PER_YEAR, assumptions, yearMarket);
    points.push({
      year,
      renewableCapacityGw,
      renewableGwh,
      dispatchDownRate: rate,
      dispatchDownGwh,
      absorbedGwh,
      blockRewardBtc,
      grossRevenueEur: revenue.revenueEur,
    });
  }
  return points;
}
