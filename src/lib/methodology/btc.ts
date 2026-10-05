import type { Assumptions, BtcMarket, MiningRevenue } from './types';
import { BLOCKS_PER_HOUR, JOULES_PER_MWH, SECONDS_PER_HOUR } from './constants';

/**
 * GROSS mining revenue from a volume of surplus energy over a period.
 *
 * expected BTC = (our work ÷ the network's work over the period) × BTC issued,
 * less the pool fee. Our work = energy used ÷ efficiency. This is revenue
 * before any cost — see computeMiningEconomics for the net picture.
 */
export function computeMiningRevenue(
  energyMwh: number,
  periodHours: number,
  assumptions: Assumptions,
  market: BtcMarket,
): MiningRevenue {
  const energy = Math.max(0, energyMwh);
  const hours = Math.max(0, periodHours);
  const usedEnergyMwh = energy * assumptions.captureFactor;
  const totalTh = assumptions.efficiencyJPerTh > 0 ? (usedEnergyMwh * JOULES_PER_MWH) / assumptions.efficiencyJPerTh : 0;
  const seconds = hours * SECONDS_PER_HOUR;
  const averageHashrateThs = seconds > 0 ? totalTh / seconds : 0;
  const share = market.networkHashrateThs > 0 ? averageHashrateThs / market.networkHashrateThs : 0;
  const blocksInPeriod = BLOCKS_PER_HOUR * hours;
  const btcGross = blocksInPeriod * market.blockRewardBtc * share;
  const btcNet = btcGross * (1 - assumptions.poolFee);
  return {
    energyMwh: energy,
    usedEnergyMwh,
    averageHashrateThs,
    networkSharePct: share * 100,
    blocksInPeriod,
    btcGross,
    btcNet,
    revenueEur: btcNet * market.priceEur,
  };
}

/**
 * Cost-side assumptions for a fleet that runs only on surplus power. Every
 * default is an Irish Grid assumption, not a quote — the Solution page lets
 * readers change each one.
 */
export interface MiningCostAssumptions {
  /** Hours a year in which surplus is available; the fleet must be sized for these peaks. */
  surplusHoursPerYear: number;
  /** ASIC hardware price, € per TH/s of capacity. */
  hardwareEurPerThs: number;
  hardwareLifeYears: number;
  /** Containers, transformers, switchgear and connection, € per kW. */
  infrastructureEurPerKw: number;
  infrastructureLifeYears: number;
  /** Operations, maintenance, staff and insurance, € per MWh used. */
  operatingEurPerMwh: number;
  /** Network and levy charges if drawing power through the grid, € per MWh. */
  networkChargesEurPerMwh: number;
  /** Payment to the generator for otherwise-wasted power, € per MWh. */
  energyPaymentEurPerMwh: number;
}

export const DEFAULT_MINING_COSTS: MiningCostAssumptions = {
  surplusHoursPerYear: 2000,
  hardwareEurPerThs: 14,
  hardwareLifeYears: 4,
  infrastructureEurPerKw: 250,
  infrastructureLifeYears: 10,
  operatingEurPerMwh: 8,
  networkChargesEurPerMwh: 20,
  energyPaymentEurPerMwh: 10,
};

export interface MiningEconomics {
  revenue: MiningRevenue;
  /** Installed fleet needed to absorb the surplus in the hours it occurs, MW. */
  fleetMw: number;
  fleetThs: number;
  /** Share of the year the fleet runs, %. */
  utilisationPct: number;
  hardwareCapexEur: number;
  infrastructureCapexEur: number;
  annualisedCapexEur: number;
  operatingCostEur: number;
  networkChargesEur: number;
  energyPaymentsEur: number;
  totalAnnualCostEur: number;
  netEur: number;
  /** BTC price at which the fleet breaks even, €. */
  breakEvenPriceEur: number;
}

/** Annual economics of a flexible fleet sized to absorb `energyMwh` of surplus a year. */
export function computeMiningEconomics(
  energyMwh: number,
  assumptions: Assumptions,
  market: BtcMarket,
  costs: MiningCostAssumptions,
): MiningEconomics {
  const revenue = computeMiningRevenue(energyMwh, 8760, assumptions, market);
  const used = revenue.usedEnergyMwh;
  const hours = Math.max(1, costs.surplusHoursPerYear);
  const fleetMw = used / hours;
  const fleetThs = assumptions.efficiencyJPerTh > 0 ? (fleetMw * 1e6) / assumptions.efficiencyJPerTh : 0;
  const hardwareCapexEur = fleetThs * costs.hardwareEurPerThs;
  const infrastructureCapexEur = fleetMw * 1000 * costs.infrastructureEurPerKw;
  const annualisedCapexEur =
    hardwareCapexEur / Math.max(1, costs.hardwareLifeYears) +
    infrastructureCapexEur / Math.max(1, costs.infrastructureLifeYears);
  const operatingCostEur = used * costs.operatingEurPerMwh;
  const networkChargesEur = used * costs.networkChargesEurPerMwh;
  const energyPaymentsEur = used * costs.energyPaymentEurPerMwh;
  const totalAnnualCostEur = annualisedCapexEur + operatingCostEur + networkChargesEur + energyPaymentsEur;
  const revenuePerEur = market.priceEur > 0 ? revenue.revenueEur / market.priceEur : 0;
  return {
    revenue,
    fleetMw,
    fleetThs,
    utilisationPct: Math.min(100, (hours / 8760) * 100),
    hardwareCapexEur,
    infrastructureCapexEur,
    annualisedCapexEur,
    operatingCostEur,
    networkChargesEur,
    energyPaymentsEur,
    totalAnnualCostEur,
    netEur: revenue.revenueEur - totalAnnualCostEur,
    breakEvenPriceEur: revenuePerEur > 0 ? totalAnnualCostEur / revenuePerEur : Infinity,
  };
}
