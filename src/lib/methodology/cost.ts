// Cost-to-billpayers model (§7.2). The headline cost is modelled as the
// compensation / constraint payments made to generators for dispatched-down
// energy — NOT a naïve (volume × price) multiply.
//
// Nuance surfaced on the Methodology page: system-wide *curtailment* is often
// UNcompensated for newer (non-priority-dispatch) generators, whereas local
// *constraints* are generally compensated. So we show both the wasted VOLUME
// and the compensated-COST portion, and the two are computed differently.

export interface CostAssumptions {
  /** Payment rate for compensated dispatch-down, €/MWh (≈ wholesale reference). */
  compensationPriceEurPerMwh: number;
  /** Share of curtailment volume that is compensated (low — many newer gens are not). */
  compensatedShareCurtailment: number;
  /** Share of constraint volume that is compensated (high — generally paid). */
  compensatedShareConstraint: number;
  /** Blended compensated share used when only a total (no split) is known. */
  compensatedShareBlended: number;
}

export const DEFAULT_COST_ASSUMPTIONS: CostAssumptions = {
  compensationPriceEurPerMwh: 75,
  compensatedShareCurtailment: 0.2,
  compensatedShareConstraint: 0.95,
  compensatedShareBlended: 0.55,
};

export interface CostResult {
  totalWastedMwh: number;
  /** Volume that attracts a compensation payment, MWh. */
  compensatedMwh: number;
  /** Modelled headline cost to billpayers, €. */
  costEur: number;
  costPerBillpayerEur: number;
  costPerPersonEur: number;
}

export interface DispatchDownVolumes {
  /** Total dispatch-down, MWh. */
  totalMwh: number;
  /** Curtailment portion, MWh (optional — only annual actuals split this out). */
  curtailmentMwh?: number;
  /** Constraint portion, MWh (optional). */
  constraintMwh?: number;
}

export function computeCost(
  volumes: DispatchDownVolumes,
  cost: CostAssumptions,
  denominators: { nBillpayers: number; nPeople: number },
): CostResult {
  const total = Math.max(0, volumes.totalMwh);

  let compensatedMwh: number;
  const hasSplit =
    typeof volumes.curtailmentMwh === 'number' && typeof volumes.constraintMwh === 'number';

  if (hasSplit) {
    // Curtailment and constraint are compensated at very different rates.
    compensatedMwh =
      Math.max(0, volumes.curtailmentMwh!) * cost.compensatedShareCurtailment +
      Math.max(0, volumes.constraintMwh!) * cost.compensatedShareConstraint;
  } else {
    // No split available (e.g. short-period estimates) → blended share.
    compensatedMwh = total * cost.compensatedShareBlended;
  }

  const costEur = compensatedMwh * cost.compensationPriceEurPerMwh;
  const costPerBillpayerEur =
    denominators.nBillpayers > 0 ? costEur / denominators.nBillpayers : 0;
  const costPerPersonEur = denominators.nPeople > 0 ? costEur / denominators.nPeople : 0;

  return {
    totalWastedMwh: total,
    compensatedMwh,
    costEur,
    costPerBillpayerEur,
    costPerPersonEur,
  };
}
