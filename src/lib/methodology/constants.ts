import type { Assumptions } from './types';

/** Seconds in an hour. */
export const SECONDS_PER_HOUR = 3600;
/** Joules per kilowatt-hour (1 kWh = 3.6e6 J). */
export const JOULES_PER_KWH = 3_600_000;
/** Bitcoin targets one block every 10 minutes → 6 blocks/hour. */
export const BLOCKS_PER_HOUR = 6;

/**
 * Transparent default assumptions (§7.4). Shown on-site next to derived figures
 * and overridable via /admin/assumptions. Denominators from §7.2 / §7.5.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  efficiencyJPerTh: 17.5, // S21-class ASIC
  uptimeFactor: 0.9, // interruptible operation (0.85–0.95 range)
  poolFee: 0.015, // 1.5%
  blockRewardBtc: 3.125, // post-April-2024 halving
  nBillpayers: 2_200_000, // domestic electricity accounts (headline)
  nPeople: 5_300_000, // population
  nHouseholds: 2_100_000, // households (forecast denominator)
  sellShareMonthly: 0.5, // 50% sold / 50% held (proposal narrative)
};

/**
 * Fallback BTC market snapshot used when live APIs are unavailable, so the site
 * always renders last-good-style figures. Refreshed hourly in production (§9).
 */
export const FALLBACK_BTC_MARKET = {
  priceEur: 92_000,
  networkHashrateThs: 750_000_000, // ≈ 750 EH/s
  difficulty: 1.01e14,
  blockRewardBtc: 3.125,
};

/** Approximate hours covered by each live/rolling period (§7.1). */
export const PERIOD_HOURS: Record<string, number> = {
  yesterday: 24,
  last_week: 24 * 7,
  last_month: 24 * 30,
  last_365: 24 * 365,
  '2022': 24 * 365,
  '2023': 24 * 365,
  '2024': 24 * 366, // 2024 was a leap year
  '2025': 24 * 365,
};
