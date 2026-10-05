// Cost of dispatch-down to billpayers — a MODEL, shown with a range.
//
// Compensation: generators with firm access are generally paid when they are
// constrained (a local network limit); system-wide curtailment is largely
// uncompensated for newer generators. So the compensated volume depends on the
// curtailment/constraint split, which the annual reports give for some years.
// Every rate below is an Irish Grid assumption, shown on the methodology page.

export interface CostAssumptions {
  /** Compensation paid per MWh of compensated dispatch-down, €. */
  compensationEurPerMwh: number;
  /** Share of curtailed (system-wide) energy that is compensated, 0–1. */
  compensatedShareCurtailment: number;
  /** Share of constrained (local) energy that is compensated, 0–1. */
  compensatedShareConstraint: number;
  /** Constraint share used when a year's split isn't reported, 0–1. */
  defaultConstraintShare: number;
}

export const COST_CASES: Record<'low' | 'central' | 'high', CostAssumptions> = {
  low: { compensationEurPerMwh: 55, compensatedShareCurtailment: 0, compensatedShareConstraint: 0.8, defaultConstraintShare: 0.35 },
  central: { compensationEurPerMwh: 75, compensatedShareCurtailment: 0.2, compensatedShareConstraint: 0.95, defaultConstraintShare: 0.5 },
  high: { compensationEurPerMwh: 95, compensatedShareCurtailment: 0.4, compensatedShareConstraint: 1, defaultConstraintShare: 0.6 },
};

/** Reference wholesale price used for the replacement-cost context, €/MWh (Irish Grid assumption). */
export const WHOLESALE_REF_EUR_PER_MWH = 95;

export interface CostResult {
  constraintShare: number;
  constraintMwh: number;
  curtailmentMwh: number;
  compensatedMwh: number;
  costEur: number;
}

export function computeCost(totalMwh: number, constraintShare: number | null, a: CostAssumptions): CostResult {
  const total = Math.max(0, totalMwh);
  const share = clamp01(constraintShare ?? a.defaultConstraintShare);
  const constraintMwh = total * share;
  const curtailmentMwh = total - constraintMwh;
  const compensatedMwh = curtailmentMwh * a.compensatedShareCurtailment + constraintMwh * a.compensatedShareConstraint;
  return { constraintShare: share, constraintMwh, curtailmentMwh, compensatedMwh, costEur: compensatedMwh * a.compensationEurPerMwh };
}

export interface CostRange {
  low: number;
  central: number;
  high: number;
}

/** Low / central / high modelled compensation for a year's dispatch-down. */
export function computeCostRange(totalMwh: number, constraintShare: number | null): CostRange {
  return {
    low: computeCost(totalMwh, constraintShare, COST_CASES.low).costEur,
    central: computeCost(totalMwh, constraintShare, COST_CASES.central).costEur,
    high: computeCost(totalMwh, constraintShare, COST_CASES.high).costEur,
  };
}

/**
 * Context only, never added to the headline: when a CONSTRAINED generator is
 * turned down, other plant (often gas) is turned up elsewhere to meet demand.
 * Curtailed energy is not replaced — it couldn't be used in the first place.
 */
export function computeReplacementCost(constraintMwh: number, wholesaleEurPerMwh: number): number {
  return Math.max(0, constraintMwh) * Math.max(0, wholesaleEurPerMwh);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
