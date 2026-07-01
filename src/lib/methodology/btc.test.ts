import { describe, it, expect } from 'vitest';
import { computeBtcSavings } from './btc';
import { DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from './constants';
import type { Assumptions, BtcMarket } from './types';

const A: Assumptions = { ...DEFAULT_ASSUMPTIONS };
const M: BtcMarket = { ...FALLBACK_BTC_MARKET };

describe('computeBtcSavings', () => {
  it('returns all-zero results for zero wasted energy', () => {
    const r = computeBtcSavings(0, 8760, A, M);
    expect(r.btcMinedNet).toBe(0);
    expect(r.valueEur).toBe(0);
    expect(r.savingPerBillpayerEur).toBe(0);
  });

  it('applies the uptime factor to usable energy', () => {
    const r = computeBtcSavings(1000, 24, A, M);
    expect(r.usableEnergyMwh).toBeCloseTo(1000 * A.uptimeFactor, 6);
    expect(r.usableEnergyKwh).toBeCloseTo(1000 * A.uptimeFactor * 1000, 3);
  });

  it('converts energy to terahashes correctly (energy J / efficiency)', () => {
    // 1 MWh usable at uptime 1, efficiency 1 J/TH → 3.6e9 J → 3.6e9 TH total.
    const a2: Assumptions = { ...A, uptimeFactor: 1, efficiencyJPerTh: 1 };
    const r = computeBtcSavings(1, 1, a2, M); // 1 hour period
    // fleetHashrate = totalTh / seconds = 3.6e9 / 3600 = 1e6 TH/s
    expect(r.fleetHashrateThs).toBeCloseTo(1e6, 0);
  });

  it('produces a credible annual figure at default assumptions', () => {
    // ~1,500 GWh dispatched down over a year.
    const r = computeBtcSavings(1_500_000, 8760, A, M);
    expect(r.networkSharePct).toBeGreaterThan(0.5);
    expect(r.networkSharePct).toBeLessThan(3);
    expect(r.btcMinedNet).toBeGreaterThan(1000);
    expect(r.btcMinedNet).toBeLessThan(3000);
    // Per-billpayer saving in a sane range (tens of euro).
    expect(r.savingPerBillpayerEur).toBeGreaterThan(20);
    expect(r.savingPerBillpayerEur).toBeLessThan(200);
  });

  it('net = gross after pool fee', () => {
    const r = computeBtcSavings(500_000, 8760, A, M);
    expect(r.btcMinedNet).toBeCloseTo(r.btcMinedGross * (1 - A.poolFee), 6);
  });

  it('value scales linearly with BTC price', () => {
    const r1 = computeBtcSavings(500_000, 8760, A, { ...M, priceEur: 50_000 });
    const r2 = computeBtcSavings(500_000, 8760, A, { ...M, priceEur: 100_000 });
    expect(r2.valueEur).toBeCloseTo(r1.valueEur * 2, 4);
  });

  it('per-person saving is lower than per-billpayer (larger denominator)', () => {
    const r = computeBtcSavings(1_000_000, 8760, A, M);
    expect(r.savingPerPersonEur).toBeLessThan(r.savingPerBillpayerEur);
  });

  it('guards against zero efficiency and zero network hashrate', () => {
    expect(computeBtcSavings(1000, 24, { ...A, efficiencyJPerTh: 0 }, M).btcMinedNet).toBe(0);
    expect(computeBtcSavings(1000, 24, A, { ...M, networkHashrateThs: 0 }).btcMinedNet).toBe(0);
  });

  it('treats negative wasted energy as zero', () => {
    const r = computeBtcSavings(-500, 24, A, M);
    expect(r.wastedMwh).toBe(0);
    expect(r.valueEur).toBe(0);
  });
});
