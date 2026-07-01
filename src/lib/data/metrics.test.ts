import { describe, it, expect } from 'vitest';
import { computePeriodMetrics, getGeneratorModelledOutput, ALL_PERIODS } from './metrics';

describe('computePeriodMetrics', () => {
  it('marks short periods as estimates and year views as actuals', () => {
    expect(computePeriodMetrics('last_week').isEstimate).toBe(true);
    expect(computePeriodMetrics('last_month').isEstimate).toBe(true);
    expect(computePeriodMetrics('2024').isEstimate).toBe(false);
  });

  it('year views expose curtailment/constraint split from actuals', () => {
    const m = computePeriodMetrics('2024');
    expect(m.curtailmentMwh).toBeGreaterThan(0);
    expect(m.constraintMwh).toBeGreaterThan(0);
    expect(m.wastedMwh).toBeCloseTo((m.curtailmentMwh ?? 0) + (m.constraintMwh ?? 0), 0);
  });

  it('produces non-negative headline figures for every period', () => {
    for (const p of ALL_PERIODS) {
      const m = computePeriodMetrics(p);
      expect(m.producedMwh).toBeGreaterThanOrEqual(0);
      expect(m.wastedMwh).toBeGreaterThanOrEqual(0);
      expect(m.costEur).toBeGreaterThanOrEqual(0);
      expect(m.btcValueEur).toBeGreaterThanOrEqual(0);
    }
  });

  it('longer periods waste more energy than shorter ones', () => {
    const week = computePeriodMetrics('last_week').wastedMwh;
    const month = computePeriodMetrics('last_month').wastedMwh;
    expect(month).toBeGreaterThan(week);
  });

  it('curtailment worsened year on year in the actuals (2022 → 2024)', () => {
    expect(computePeriodMetrics('2024').wastedMwh).toBeGreaterThan(computePeriodMetrics('2022').wastedMwh);
  });
});

describe('getGeneratorModelledOutput', () => {
  it('pro-rates fuel-type system generation across installed capacity', () => {
    const r = getGeneratorModelledOutput('aghada', 'last_week');
    expect(r).not.toBeNull();
    expect(r!.modelledOutputMwh).toBeGreaterThan(0);
    expect(r!.isEstimate).toBe(true);
  });

  it('attributes wasted energy only to wind plants', () => {
    const wind = getGeneratorModelledOutput('galway-wind-park', 'last_week');
    const gas = getGeneratorModelledOutput('aghada', 'last_week');
    expect(wind!.attributableWastedMwh).toBeGreaterThan(0);
    expect(gas!.attributableWastedMwh).toBe(0);
  });

  it('returns null for an unknown generator', () => {
    expect(getGeneratorModelledOutput('does-not-exist', 'last_week')).toBeNull();
  });
});
