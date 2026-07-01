import { describe, it, expect } from 'vitest';
import { computeCost, computeReplacementCost, DEFAULT_COST_ASSUMPTIONS } from './cost';
import { DEFAULT_ASSUMPTIONS } from './constants';

const C = { ...DEFAULT_COST_ASSUMPTIONS };
const D = { nBillpayers: DEFAULT_ASSUMPTIONS.nBillpayers, nPeople: DEFAULT_ASSUMPTIONS.nPeople };

describe('computeCost', () => {
  it('uses the split-aware model when curtailment/constraint are provided', () => {
    const r = computeCost(
      { totalMwh: 1000, curtailmentMwh: 800, constraintMwh: 200 },
      C,
      D,
    );
    // 800*0.2 + 200*0.95 = 160 + 190 = 350 MWh compensated.
    expect(r.compensatedMwh).toBeCloseTo(350, 6);
    expect(r.costEur).toBeCloseTo(350 * C.compensationPriceEurPerMwh, 4);
  });

  it('does NOT compensate all dispatched-down energy (the key nuance)', () => {
    const r = computeCost(
      { totalMwh: 1000, curtailmentMwh: 800, constraintMwh: 200 },
      C,
      D,
    );
    expect(r.compensatedMwh).toBeLessThan(r.totalWastedMwh);
  });

  it('falls back to the blended share when no split is available', () => {
    const r = computeCost({ totalMwh: 1000 }, C, D);
    expect(r.compensatedMwh).toBeCloseTo(1000 * C.compensatedShareBlended, 6);
  });

  it('computes per-billpayer and per-person costs from denominators', () => {
    const r = computeCost({ totalMwh: 100_000 }, C, D);
    expect(r.costPerBillpayerEur).toBeCloseTo(r.costEur / D.nBillpayers, 6);
    expect(r.costPerPersonEur).toBeCloseTo(r.costEur / D.nPeople, 6);
    expect(r.costPerPersonEur).toBeLessThan(r.costPerBillpayerEur);
  });

  it('treats negative volume as zero', () => {
    const r = computeCost({ totalMwh: -5 }, C, D);
    expect(r.costEur).toBe(0);
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
