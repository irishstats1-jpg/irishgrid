import { describe, it, expect } from 'vitest';
import { computeMiningEconomics, computeMiningRevenue, DEFAULT_MINING_COSTS } from './btc';
import { averageBlockReward, blockRewardAt, DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from './constants';
import type { Assumptions, BtcMarket } from './types';

const A: Assumptions = { ...DEFAULT_ASSUMPTIONS };
const M: BtcMarket = { ...FALLBACK_BTC_MARKET };

describe('computeMiningRevenue', () => {
  it('returns zero for zero energy', () => {
    const r = computeMiningRevenue(0, 8760, A, M);
    expect(r.btcNet).toBe(0);
    expect(r.revenueEur).toBe(0);
  });

  it('applies the capture factor to the energy used', () => {
    const r = computeMiningRevenue(1000, 24, A, M);
    expect(r.usedEnergyMwh).toBeCloseTo(1000 * A.captureFactor, 6);
  });

  it('converts energy to hashrate (energy ÷ efficiency ÷ time)', () => {
    // 1 MWh at capture 1 and 1 J/TH = 3.6e9 TH over one hour = 1e6 TH/s.
    const r = computeMiningRevenue(1, 1, { ...A, captureFactor: 1, efficiencyJPerTh: 1 }, M);
    expect(r.averageHashrateThs).toBeCloseTo(1e6, 0);
  });

  it('gives about 1% of the network for the 2024 volume at today’s network', () => {
    const r = computeMiningRevenue(1_266_000, 8760, A, M);
    expect(r.networkSharePct).toBeGreaterThan(0.5);
    expect(r.networkSharePct).toBeLessThan(2);
    expect(r.btcNet).toBeGreaterThan(800);
    expect(r.btcNet).toBeLessThan(3000);
  });

  it('net = gross after the pool fee', () => {
    const r = computeMiningRevenue(500_000, 8760, A, M);
    expect(r.btcNet).toBeCloseTo(r.btcGross * (1 - A.poolFee), 6);
  });

  it('revenue scales linearly with price and inversely with network hashrate', () => {
    const base = computeMiningRevenue(500_000, 8760, A, M).revenueEur;
    expect(computeMiningRevenue(500_000, 8760, A, { ...M, priceEur: M.priceEur * 2 }).revenueEur).toBeCloseTo(base * 2, 2);
    expect(computeMiningRevenue(500_000, 8760, A, { ...M, networkHashrateThs: M.networkHashrateThs * 2 }).revenueEur).toBeCloseTo(base / 2, 2);
  });

  it('guards against zero efficiency, zero network and negative energy', () => {
    expect(computeMiningRevenue(1000, 24, { ...A, efficiencyJPerTh: 0 }, M).btcNet).toBe(0);
    expect(computeMiningRevenue(1000, 24, A, { ...M, networkHashrateThs: 0 }).btcNet).toBe(0);
    expect(computeMiningRevenue(-500, 24, A, M).revenueEur).toBe(0);
  });
});

describe('computeMiningEconomics', () => {
  it('sizes the fleet for the hours the surplus is available', () => {
    const e = computeMiningEconomics(1_000_000, A, M, DEFAULT_MINING_COSTS);
    expect(e.fleetMw).toBeCloseTo((1_000_000 * A.captureFactor) / DEFAULT_MINING_COSTS.surplusHoursPerYear, 6);
  });

  it('net = revenue − total annual cost', () => {
    const e = computeMiningEconomics(1_000_000, A, M, DEFAULT_MINING_COSTS);
    expect(e.netEur).toBeCloseTo(e.revenue.revenueEur - e.totalAnnualCostEur, 2);
  });

  it('breaks even exactly at the break-even price', () => {
    const e = computeMiningEconomics(1_000_000, A, M, DEFAULT_MINING_COSTS);
    const at = computeMiningEconomics(1_000_000, A, { ...M, priceEur: e.breakEvenPriceEur }, DEFAULT_MINING_COSTS);
    expect(Math.abs(at.netEur)).toBeLessThan(1);
  });

  it('more surplus hours mean a smaller fleet and a better result', () => {
    const few = computeMiningEconomics(1_000_000, A, M, { ...DEFAULT_MINING_COSTS, surplusHoursPerYear: 1000 });
    const many = computeMiningEconomics(1_000_000, A, M, { ...DEFAULT_MINING_COSTS, surplusHoursPerYear: 6000 });
    expect(many.fleetMw).toBeLessThan(few.fleetMw);
    expect(many.netEur).toBeGreaterThan(few.netEur);
  });
});

describe('block subsidy schedule', () => {
  it('is 3.125 BTC between the 2024 and 2028 halvings', () => {
    expect(blockRewardAt(2026)).toBe(3.125);
    expect(blockRewardAt(2029)).toBe(1.5625);
  });

  it('averages across the halving year', () => {
    const avg = averageBlockReward(2028);
    expect(avg).toBeLessThan(3.125);
    expect(avg).toBeGreaterThan(1.5625);
  });
});
