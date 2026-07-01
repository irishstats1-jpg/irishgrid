// Official annual dispatch-down actuals (§6, §7.1). Year views use these
// authoritative figures rather than modelled estimates.
//
// SEED DATA calibrated to the EirGrid Annual Renewable Energy Constraint &
// Curtailment reports (wind dispatch-down 8.5% in 2022 → 10.7% in 2023 →
// 14.0% in 2024). Replace with exact report figures via /admin when each
// report is imported.

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
    gwh: 1350,
    curtailmentGwh: 900,
    constraintGwh: 450,
    windDispatchDownPct: 8.5,
    notes: 'Seed figures — replace with exact report values on import.',
  },
  {
    year: 2023,
    region: 'ROI',
    source: 'EirGrid Annual Renewable Energy Constraint & Curtailment Report 2023',
    gwh: 2100,
    curtailmentGwh: 1450,
    constraintGwh: 650,
    windDispatchDownPct: 10.7,
    notes: 'Seed figures — replace with exact report values on import.',
  },
  {
    year: 2024,
    region: 'ROI',
    source: 'EirGrid Annual Renewable Energy Constraint & Curtailment Report 2024',
    gwh: 3100,
    curtailmentGwh: 2250,
    constraintGwh: 850,
    windDispatchDownPct: 14.0,
    notes: 'Seed figures — replace with exact report values on import.',
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
};
