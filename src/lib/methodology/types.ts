// Shared types for the Irish Grid methodology engine (§7).

export type FuelType =
  | 'wind'
  | 'solar'
  | 'gas'
  | 'hydro'
  | 'coal'
  | 'oil'
  | 'other'
  | 'imports';

export type PeriodKey =
  | 'yesterday'
  | 'last_week'
  | 'last_month'
  | 'last_365'
  | '2022'
  | '2023'
  | '2024'
  | '2025';

/**
 * Mining + cost assumptions (§7.4). These live in the `assumptions` table and
 * are editable in /admin/assumptions — they are NEVER hard-coded into figures.
 * The values here are the transparent, documented defaults.
 */
export interface Assumptions {
  /** ASIC efficiency, joules per terahash (S21-class ≈ 17.5 J/TH). */
  efficiencyJPerTh: number;
  /** Interruptible-operation uptime factor (0–1). Curtailment is intermittent. */
  uptimeFactor: number;
  /** Mining-pool fee (0–1). */
  poolFee: number;
  /** Current block subsidy in BTC (3.125 post-April-2024 halving). */
  blockRewardBtc: number;
  /** Domestic electricity accounts — the headline "billpayer" denominator. */
  nBillpayers: number;
  /** Population — the "per person" denominator. */
  nPeople: number;
  /** Households denominator for the forecast per-household savings (§7.5). */
  nHouseholds: number;
  /** Proposal narrative only (§5.3): share of mined BTC sold monthly. */
  sellShareMonthly: number;
}

/** Live-ish Bitcoin market + network state (cached hourly from APIs). */
export interface BtcMarket {
  priceEur: number;
  /** Total network hashrate in TH/s. */
  networkHashrateThs: number;
  /** Mining difficulty (informational; hashrate is used directly). */
  difficulty: number;
  blockRewardBtc: number;
}

/** Result of the BTC-savings model, with every intermediate exposed (§7.3). */
export interface BtcSavingsResult {
  wastedMwh: number;
  usableEnergyMwh: number;
  usableEnergyKwh: number;
  /** Effective fleet hashrate (TH/s) the usable energy could sustain. */
  fleetHashrateThs: number;
  networkSharePct: number;
  blocksInPeriod: number;
  btcMinedGross: number;
  btcMinedNet: number;
  valueEur: number;
  savingPerBillpayerEur: number;
  savingPerPersonEur: number;
}
