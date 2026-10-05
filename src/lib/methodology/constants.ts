import type { Assumptions, BtcMarket } from './types';

export const SECONDS_PER_HOUR = 3600;
export const HOURS_PER_YEAR = 8760;
/** Joules per MWh (1 MWh = 3.6 × 10⁹ J). */
export const JOULES_PER_MWH = 3.6e9;
/** Bitcoin targets one block every 10 minutes. */
export const BLOCKS_PER_HOUR = 6;

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  efficiencyJPerTh: 17.5, // Antminer S21-class
  captureFactor: 0.9, // 90% of surplus energy used
  poolFee: 0.015, // 1.5%
};

/**
 * Used only when CoinGecko / mempool.space are unreachable. Pages say so
 * explicitly whenever these values are in use. Snapshot of 4 October 2026
 * (CoinGecko BTC/EUR; network hashrate ≈ 800 EH/s).
 */
export const FALLBACK_BTC_MARKET: BtcMarket = {
  priceEur: 75_800,
  networkHashrateThs: 800_000_000, // 800 EH/s
  difficulty: 1.12e14,
  blockRewardBtc: 3.125,
  asOf: '2026-10-04T00:00:00.000Z',
  live: false,
};

/** Approximate dates of Bitcoin halvings (as fractional years, ~April). */
const HALVINGS = [2024.3, 2028.3, 2032.3, 2036.3, 2040.3, 2044.3, 2048.3];

/** Block subsidy at a moment in time (fractional year). */
export function blockRewardAt(t: number): number {
  let reward = 6.25;
  for (const h of HALVINGS) if (t >= h) reward /= 2;
  return reward;
}

/** Average block subsidy across a calendar year (monthly steps). */
export function averageBlockReward(year: number): number {
  let sum = 0;
  for (let m = 0; m < 12; m++) sum += blockRewardAt(year + (m + 0.5) / 12);
  return sum / 12;
}
