import { describe, it, expect } from 'vitest';
import { computeYearMetrics, getAllYears, getHeadlineYear, mergeAnnual } from './metrics';
import { ANNUAL_DISPATCH_DOWN, HOUSEHOLDS, type AnnualDispatchDown } from './dispatchDown';
import { FALLBACK_BTC_MARKET } from '../methodology';
import { eurModel, roundSig } from '../format';

const seed = (year: number) => ANNUAL_DISPATCH_DOWN.find((d) => d.year === year)!;

describe('annual series', () => {
  it('matches the published EirGrid figures for reported years', () => {
    expect(seed(2022).windGwh).toBe(988);
    expect(seed(2023).windGwh).toBe(1124);
    expect(seed(2024).windGwh).toBe(1266);
    expect(seed(2024).windPctOfAvailable).toBe(10.1);
  });

  it('cites a source document for every year', () => {
    for (const d of ANNUAL_DISPATCH_DOWN) expect(d.sourceUrl).toMatch(/^https:\/\//);
  });

  it('headlines the latest REPORTED year, not a provisional one', () => {
    const h = getHeadlineYear();
    expect(h.method).toBe('reported');
    const latest = getAllYears()[0];
    expect(h.year).toBeLessThanOrEqual(latest.year);
  });
});

describe('computeYearMetrics', () => {
  const m = computeYearMetrics(seed(2024), FALLBACK_BTC_MARKET);

  it('uses the reported split when the report gives one', () => {
    expect(m.constraintShareReported).toBe(true);
    expect(m.constraintShare).toBe(0.5);
    expect(m.constraintMwh + m.curtailmentMwh).toBeCloseTo(m.windMwh, 6);
  });

  it('divides by households, the one denominator', () => {
    expect(m.costPerHousehold.central).toBeCloseTo(m.cost.central / HOUSEHOLDS.count, 6);
  });

  it('values replacement on the constrained volume only', () => {
    expect(m.replacementCostEur).toBeCloseTo(m.constraintMwh * 95, 2);
  });

  it('assumes the split when the report does not give one', () => {
    const y = computeYearMetrics(seed(2022), FALLBACK_BTC_MARKET);
    expect(y.constraintShareReported).toBe(false);
  });
});

describe('mergeAnnual', () => {
  const row = (over: Partial<AnnualDispatchDown>): AnnualDispatchDown => ({ ...seed(2024), ...over });

  it('never lets a database row overwrite a reported seed', () => {
    const merged = mergeAnnual(ANNUAL_DISPATCH_DOWN, [row({ year: 2024, windGwh: 99999, method: 'reported' })]);
    expect(merged.find((d) => d.year === 2024)!.windGwh).toBe(1266);
  });

  it('lets a reported row replace a provisional seed', () => {
    const merged = mergeAnnual(ANNUAL_DISPATCH_DOWN, [row({ year: 2025, windGwh: 1400, method: 'reported' })]);
    const y = merged.find((d) => d.year === 2025)!;
    expect(y.windGwh).toBe(1400);
    expect(y.method).toBe('reported');
  });

  it('ignores provisional rows', () => {
    const merged = mergeAnnual(ANNUAL_DISPATCH_DOWN, [row({ year: 2026, windGwh: 2000, method: 'provisional' })]);
    expect(merged.find((d) => d.year === 2026)).toBeUndefined();
  });

  it('adds a new reported year', () => {
    const merged = mergeAnnual(ANNUAL_DISPATCH_DOWN, [row({ year: 2026, windGwh: 2000, method: 'reported' })]);
    expect(merged[merged.length - 1].year).toBe(2026);
  });
});

describe('rounding of modelled figures', () => {
  it('rounds to two significant figures', () => {
    expect(roundSig(54_596_250)).toBe(55_000_000);
    expect(roundSig(29.65)).toBe(30);
    expect(roundSig(0.8734)).toBe(0.87);
    expect(eurModel(54_596_250)).toBe('€55M');
    expect(eurModel(-57_400_000)).toBe('-€57M');
  });
});
