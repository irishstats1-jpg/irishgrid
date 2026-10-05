// Shared types for the Irish Grid methodology engine.

export type FuelType = 'wind' | 'solar' | 'gas' | 'hydro' | 'storage' | 'coal' | 'oil' | 'other' | 'imports';

/** The site works in calendar years only ("2024"): every figure has a reported or provisional basis. */
export type PeriodKey = `${number}`;

/** Technical mining assumptions (the revenue side). */
export interface Assumptions {
  /** ASIC efficiency, joules per terahash (Antminer S21-class ≈ 17.5 J/TH). */
  efficiencyJPerTh: number;
  /**
   * Share of the surplus energy a flexible fleet actually uses (0–1), allowing
   * for ramping, maintenance and periods too short to be worth running.
   */
  captureFactor: number;
  /** Mining-pool fee (0–1). */
  poolFee: number;
}

/** Bitcoin market and network state used for a calculation. */
export interface BtcMarket {
  priceEur: number;
  /** Total network hashrate, TH/s. */
  networkHashrateThs: number;
  difficulty: number;
  /** Block subsidy, BTC (transaction fees are excluded — conservative). */
  blockRewardBtc: number;
  /** When the price/hashrate were taken (ISO). */
  asOf: string;
  /** False when live data was unavailable and fallback values are in use. */
  live: boolean;
}

/** Gross mining revenue for a volume of surplus energy over a period. */
export interface MiningRevenue {
  energyMwh: number;
  usedEnergyMwh: number;
  /** Average fleet hashrate over the whole period, TH/s. */
  averageHashrateThs: number;
  networkSharePct: number;
  blocksInPeriod: number;
  btcGross: number;
  btcNet: number;
  revenueEur: number;
}
