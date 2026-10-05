import { describe, it, expect } from 'vitest';
import { computeCost, computeCostRange, computeReplacementCost, COST_CASES } from './cost';

const C = COST_CASES.central;

describe('computeCost', () => {
  it('compensates constraint and curtailment at different shares', () => {
    const r = computeCost(1000, 0.2, C);
    // 200 constraint × 0.95 + 800 curtailment × 0.2 = 190 + 160 = 350 MWh.
    expect(r.compensatedMwh).toBeCloseTo(350, 6);
    expect(r.costEur).toBeCloseTo(350 * C.compensationEurPerMwh, 4);
  });

  it('never compensates all of the volume in the central case', () => {
    expect(computeCost(1000, 0.5, C).compensatedMwh).toBeLessThan(1000);
  });

  it('uses the case’s default split when the split is not reported', () => {
    const r = computeCost(1000, null, C);
    expect(r.constraintShare).toBe(C.defaultConstraintShare);
  });

  it('treats negative volume as zero and clamps the split', () => {
    expect(computeCost(-5, 0.5, C).costEur).toBe(0);
    expect(computeCost(1000, 2, C).constraintShare).toBe(1);
  });
});

describe('computeCostRange', () => {
  it('orders low ≤ central ≤ high', () => {
    for (const share of [null, 0, 0.5, 1]) {
      const r = computeCostRange(1_266_000, share);
      expect(r.low).toBeLessThanOrEqual(r.central);
      expect(r.central).toBeLessThanOrEqual(r.high);
    }
  });

  it('gives tens of millions of euro for the 2024 volume', () => {
    const r = computeCostRange(1_266_000, 0.5);
    expect(r.central).toBeGreaterThan(20e6);
    expect(r.central).toBeLessThan(150e6);
  });
});

describe('computeReplacementCost', () => {
  it('is volume × wholesale price', () => {
    expect(computeReplacementCost(1000, 95)).toBe(95_000);
  });
  it('clamps negatives to zero', () => {
    expect(computeReplacementCost(-1000, 95)).toBe(0);
    expect(computeReplacementCost(1000, -95)).toBe(0);
  });
});
