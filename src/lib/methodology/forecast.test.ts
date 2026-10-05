import { describe, it, expect } from 'vitest';
import { computeForecast, dispatchDownRate, interpolateCapacity, DEFAULT_FORECAST_CONFIG } from './forecast';
import { DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from './constants';

const A = { ...DEFAULT_ASSUMPTIONS };
const M = { ...FALLBACK_BTC_MARKET };
const CFG = { ...DEFAULT_FORECAST_CONFIG };

describe('interpolateCapacity', () => {
  it('returns anchor values at anchor years and interpolates between them', () => {
    expect(interpolateCapacity(CFG.capacityAnchors, 2030)).toBe(22);
    expect(interpolateCapacity(CFG.capacityAnchors, 2035)).toBeCloseTo(32.5, 6);
  });

  it('clamps outside the anchor range', () => {
    expect(interpolateCapacity(CFG.capacityAnchors, 2000)).toBe(7);
    expect(interpolateCapacity(CFG.capacityAnchors, 2100)).toBe(63);
  });
});

describe('dispatchDownRate', () => {
  it('equals the reported base rate at the reference capacity', () => {
    expect(dispatchDownRate(CFG.curtailmentRefCapacityGw, CFG)).toBeCloseTo(CFG.dispatchDownBaseRate, 6);
  });

  it('rises with capacity but is capped', () => {
    expect(dispatchDownRate(20, CFG)).toBeGreaterThan(CFG.dispatchDownBaseRate);
    expect(dispatchDownRate(1000, CFG)).toBe(CFG.dispatchDownMaxRate);
  });
});

describe('computeForecast', () => {
  it('produces one point per year', () => {
    const pts = computeForecast('bau', CFG, A, M);
    expect(pts).toHaveLength(CFG.endYear - CFG.startYear + 1);
    expect(pts[0].year).toBe(CFG.startYear);
  });

  it('business as usual uses nothing; flexible demand uses the configured share', () => {
    const bau = computeForecast('bau', CFG, A, M);
    const flex = computeForecast('with_flexible_demand', CFG, A, M);
    expect(bau[5].absorbedGwh).toBe(0);
    expect(bau[5].grossRevenueEur).toBe(0);
    expect(flex[5].absorbedGwh).toBeCloseTo(flex[5].dispatchDownGwh * CFG.flexibleAbsorbedShare, 4);
  });

  it('halvings cut the block subsidy', () => {
    const pts = computeForecast('with_flexible_demand', CFG, A, M);
    const y2027 = pts.find((p) => p.year === 2027)!;
    const y2029 = pts.find((p) => p.year === 2029)!;
    expect(y2029.blockRewardBtc).toBeCloseTo(y2027.blockRewardBtc / 2, 6);
  });

  it('with flat price and growing network, revenue per GWh falls over time', () => {
    const pts = computeForecast('with_flexible_demand', CFG, A, M);
    const first = pts[0].grossRevenueEur / pts[0].absorbedGwh;
    const last = pts[pts.length - 1].grossRevenueEur / pts[pts.length - 1].absorbedGwh;
    expect(last).toBeLessThan(first);
  });

  it('a faster pathway builds more capacity and more dispatch-down', () => {
    const slow = computeForecast('bau', { ...CFG, pathwayMultiplier: 0.7 }, A, M);
    const fast = computeForecast('bau', { ...CFG, pathwayMultiplier: 1.3 }, A, M);
    const i = slow.length - 1;
    expect(fast[i].renewableCapacityGw).toBeGreaterThan(slow[i].renewableCapacityGw);
    expect(fast[i].dispatchDownGwh).toBeGreaterThan(slow[i].dispatchDownGwh);
  });
});
