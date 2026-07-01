import { describe, it, expect } from 'vitest';
import {
  computeForecast,
  interpolateCapacity,
  curtailmentRate,
  DEFAULT_FORECAST_CONFIG,
} from './forecast';
import { DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from './constants';

const A = { ...DEFAULT_ASSUMPTIONS };
const M = { ...FALLBACK_BTC_MARKET };
const CFG = { ...DEFAULT_FORECAST_CONFIG };

describe('interpolateCapacity', () => {
  it('returns anchor values exactly at anchor years', () => {
    expect(interpolateCapacity(CFG.capacityAnchors, 2030)).toBe(22);
    expect(interpolateCapacity(CFG.capacityAnchors, 2040)).toBe(43);
  });

  it('interpolates linearly between anchors', () => {
    // Halfway 2030(22)→2040(43) at 2035 → 32.5.
    expect(interpolateCapacity(CFG.capacityAnchors, 2035)).toBeCloseTo(32.5, 6);
  });

  it('clamps outside the anchor range', () => {
    expect(interpolateCapacity(CFG.capacityAnchors, 2000)).toBe(7);
    expect(interpolateCapacity(CFG.capacityAnchors, 2100)).toBe(63);
  });
});

describe('curtailmentRate', () => {
  it('equals the base rate at the reference capacity', () => {
    expect(curtailmentRate(CFG.curtailmentRefCapacityGw, CFG)).toBeCloseTo(CFG.curtailmentBaseRate, 6);
  });

  it('rises with capacity but is capped', () => {
    expect(curtailmentRate(100, CFG)).toBe(CFG.curtailmentMaxRate);
    expect(curtailmentRate(20, CFG)).toBeGreaterThan(CFG.curtailmentBaseRate);
  });
});

describe('computeForecast', () => {
  it('produces one point per year across the horizon', () => {
    const pts = computeForecast('bau', CFG, A, M);
    expect(pts).toHaveLength(CFG.endYear - CFG.startYear + 1);
    expect(pts[0].year).toBe(CFG.startYear);
    expect(pts[pts.length - 1].year).toBe(CFG.endYear);
  });

  it('BAU recovers nothing; with_mining recovers a positive share', () => {
    const bau = computeForecast('bau', CFG, A, M);
    const mining = computeForecast('with_mining', CFG, A, M);
    expect(bau[10].recoveredGwh).toBe(0);
    expect(bau[10].savingPerHouseholdEur).toBe(0);
    expect(mining[10].recoveredGwh).toBeGreaterThan(0);
    expect(mining[10].savingPerHouseholdEur).toBeGreaterThan(0);
  });

  it('curtailment volume grows over the horizon (problem scales with capacity)', () => {
    const pts = computeForecast('bau', CFG, A, M);
    expect(pts[pts.length - 1].curtailmentGwh).toBeGreaterThan(pts[0].curtailmentGwh);
  });

  it('recovered energy is the configured share of curtailment', () => {
    const pts = computeForecast('with_mining', CFG, A, M);
    const p = pts[5];
    expect(p.recoveredGwh).toBeCloseTo(p.curtailmentGwh * CFG.miningAbsorbedShare, 4);
  });

  it('a faster pathway builds more capacity and more curtailment', () => {
    const slow = computeForecast('bau', { ...CFG, pathwayMultiplier: 0.7 }, A, M);
    const fast = computeForecast('bau', { ...CFG, pathwayMultiplier: 1.3 }, A, M);
    const last = slow.length - 1;
    expect(fast[last].renewableCapacityGw).toBeGreaterThan(slow[last].renewableCapacityGw);
    expect(fast[last].curtailmentGwh).toBeGreaterThan(slow[last].curtailmentGwh);
  });
});
