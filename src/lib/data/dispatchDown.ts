// Official annual dispatch-down actuals (§6, §7.1). Year views use these
// authoritative figures rather than modelled estimates.
//
// Volumes below are the REPUBLIC OF IRELAND (ROI) figures from EirGrid's
// Annual Renewable Energy Constraint & Curtailment Reports. Note the oft-quoted
// 8.5% → 10.7% → 14.0% dispatch-down climb is the ALL-ISLAND wind series; the
// ROI-only percentages are lower and shown here.
//
// The curtailment/constraint split per year is APPROXIMATED at ~70/30 (in ROI,
// system-wide curtailment — SNSP limit + minimum conventional generation —
// dominates; EirGrid reported ~96% of ROI curtailment in 2024 was driven by the
// min-gen requirement). Replace with the exact split via the admin import.
//
// AUTO-UPDATE: at runtime these seeds are overridden by rows in the Supabase
// `dispatch_down_actuals` table when configured (see lib/data/metrics.ts), so
// updating a year = editing a DB row, no redeploy.

export interface DispatchDownActual {
  year: number;
  region: 'ROI';
  source: string;
  gwh: number;
  curtailmentGwh: number;
  constraintGwh: number;
  windDispatchDownPct: number;
  notes: string;
}

export const DISPATCH_DOWN_ACTUALS: DispatchDownActual[] = [
  {
    year: 2022,
    region: 'ROI',
    source: 'EirGrid Annual Renewable Energy Constraint & Curtailment Report 2022',
    gwh: 989,
    curtailmentGwh: 692,
    constraintGwh: 297,
    windDispatchDownPct: 8.2,
    notes:
      'ROI wind dispatch-down ≈ 989 GWh (all-island 1,280 GWh minus NI 291 GWh). ROI % estimated; split approximated 70/30.',
  },
  {
    year: 2023,
    region: 'ROI',
    source: 'EirGrid Annual Renewable Energy Constraint & Curtailment Report 2023',
    gwh: 1124,
    curtailmentGwh: 787,
    constraintGwh: 337,
    windDispatchDownPct: 8.9,
    notes:
      'ROI wind dispatch-down 1,124 GWh = 8.9% of available wind (report figure). Split approximated 70/30.',
  },
  {
    year: 2024,
    region: 'ROI',
    source: 'EirGrid Annual Renewable Energy Constraint & Curtailment Report 2024',
    gwh: 1305,
    curtailmentGwh: 915,
    constraintGwh: 390,
    windDispatchDownPct: 8.8,
    notes:
      'ROI wind 1,266 GWh + solar 39 GWh dispatch-down (report figures; ROI renewable DD ≈ 8.8%). Split approximated 70/30.',
  },
  {
    year: 2025,
    region: 'ROI',
    source: 'Provisional — extrapolated from the 2022–2024 ROI trend',
    gwh: 1500,
    curtailmentGwh: 1050,
    constraintGwh: 450,
    windDispatchDownPct: 9.5,
    notes:
      'PROVISIONAL estimate pending the official 2025 report — replace via admin/Supabase when published.',
  },
];

export function getActual(year: number): DispatchDownActual | undefined {
  return DISPATCH_DOWN_ACTUALS.find((a) => a.year === year);
}

/** Total generation (GWh) per year, for computing produced totals in year views. */
export const ANNUAL_GENERATION_GWH: Record<number, number> = {
  2022: 33_500,
  2023: 33_000,
  2024: 34_000,
  2025: 35_000,
};
