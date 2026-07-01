import type { Assumptions, BtcMarket, BtcSavingsResult } from './types';
import { BLOCKS_PER_HOUR, JOULES_PER_KWH, SECONDS_PER_HOUR } from './constants';

/**
 * BTC-mineable value & billpayer savings for a given wasted-energy volume (§7.3).
 *
 * Every intermediate is returned so the figure is fully auditable on-site
 * (the Methodology page renders these step by step). The difficulty/hashrate
 * math uses network hashrate directly, which is the robust route: our expected
 * BTC = (our work over the period ÷ total network work over the period) ×
 * (BTC issued over the period).
 *
 * @param wastedMwh   Dispatched-down energy available to the fleet, MWh.
 * @param periodHours Length of the period in hours (issuance + network work scale with this).
 */
export function computeBtcSavings(
  wastedMwh: number,
  periodHours: number,
  assumptions: Assumptions,
  market: BtcMarket,
): BtcSavingsResult {
  const wasted = Math.max(0, wastedMwh);
  const hours = Math.max(0, periodHours);

  // 1. Only a fraction of the wasted energy is actually captured — interruptible
  //    operation means the miners are not running 100% of the time.
  const usableEnergyMwh = wasted * assumptions.uptimeFactor;
  const usableEnergyKwh = usableEnergyMwh * 1000;

  // 2. Convert captured energy → total terahashes computed.
  //    energy(J) / efficiency(J per TH) = terahashes.
  const totalJoules = usableEnergyKwh * JOULES_PER_KWH;
  const totalTh = assumptions.efficiencyJPerTh > 0 ? totalJoules / assumptions.efficiencyJPerTh : 0;

  // 3. Average continuous hashrate that work represents across the period.
  const periodSeconds = hours * SECONDS_PER_HOUR;
  const fleetHashrateThs = periodSeconds > 0 ? totalTh / periodSeconds : 0;

  // 4. Our share of total network work over the period.
  const networkShare =
    market.networkHashrateThs > 0 ? fleetHashrateThs / market.networkHashrateThs : 0;

  // 5. Expected BTC = issuance over the period × our share, less pool fee.
  const blocksInPeriod = BLOCKS_PER_HOUR * hours;
  const btcMinedGross = blocksInPeriod * market.blockRewardBtc * networkShare;
  const btcMinedNet = btcMinedGross * (1 - assumptions.poolFee);

  // 6. Value and per-capita savings.
  const valueEur = btcMinedNet * market.priceEur;
  const savingPerBillpayerEur =
    assumptions.nBillpayers > 0 ? valueEur / assumptions.nBillpayers : 0;
  const savingPerPersonEur = assumptions.nPeople > 0 ? valueEur / assumptions.nPeople : 0;

  return {
    wastedMwh: wasted,
    usableEnergyMwh,
    usableEnergyKwh,
    fleetHashrateThs,
    networkSharePct: networkShare * 100,
    blocksInPeriod,
    btcMinedGross,
    btcMinedNet,
    valueEur,
    savingPerBillpayerEur,
    savingPerPersonEur,
  };
}
