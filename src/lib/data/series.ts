import type { FuelType } from '../methodology/types';

// Deterministic synthetic daily fuel-mix series that stands in for
// `generation_snapshots` (§8). In production this is the hourly EirGrid Smart
// Grid Dashboard pull; here it is generated reproducibly so charts, the map's
// modelled per-plant output, and short-period estimates all have coherent data.
//
// Every short-period figure derived from this series is a MODELLED ESTIMATE and
// must be labelled as such on-site (§7.1).

export interface DaySeriesPoint {
  date: string; // ISO yyyy-mm-dd
  produced: Record<FuelType, number>; // MWh generated that day
  demandMwh: number;
  windAvailableMwh: number; // available wind (before dispatch-down)
}

/** mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WIND_INSTALLED_MW = 4900; // ≈ ROI onshore+offshore wind capacity
const SOLAR_INSTALLED_MW = 1000;

/**
 * Build a deterministic year of daily points ending "today". Uses a fixed seed
 * so results are stable across renders/SSR and match between server & client.
 */
export function buildYearSeries(referenceDate: Date, days = 365): DaySeriesPoint[] {
  const rand = mulberry32(20260701);
  const points: DaySeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(referenceDate);
    date.setUTCDate(date.getUTCDate() - i);
    const doy = dayOfYear(date);

    // Seasonal wind: higher in winter. Base CF 0.30, ±0.12 seasonal, ±0.2 noise.
    const seasonalWind = 0.3 + 0.12 * Math.cos((2 * Math.PI * doy) / 365);
    const windCf = clamp(seasonalWind + (rand() - 0.5) * 0.4, 0.05, 0.85);
    const windAvailableMwh = WIND_INSTALLED_MW * 24 * windCf;

    // Solar: strong summer, weak winter.
    const solarCf = clamp(0.11 - 0.09 * Math.cos((2 * Math.PI * doy) / 365) + (rand() - 0.5) * 0.04, 0.005, 0.28);
    const solarMwh = SOLAR_INSTALLED_MW * 24 * solarCf;

    // Demand: ~96 GWh/day, mild winter peak, weekday/weekend variation.
    const weekday = date.getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.92 : 1.0;
    const demandMwh = (96_000 + 8000 * Math.cos((2 * Math.PI * doy) / 365)) * weekendFactor;

    // Dispatch-down rises with high wind & oversupply. More wind → more waste.
    const oversupplyPressure = clamp((windAvailableMwh / demandMwh - 0.35) * 1.6, 0, 1);
    const ddRate = clamp(0.06 + oversupplyPressure * 0.28 + (rand() - 0.5) * 0.05, 0, 0.45);
    const windCurtailedMwh = windAvailableMwh * ddRate;
    const windProducedMwh = windAvailableMwh - windCurtailedMwh;

    const hydroMwh = 1500 + rand() * 1200;
    const importsMwh = clamp(6000 + (rand() - 0.5) * 6000, 0, 12000);

    // Gas fills the residual after renewables/hydro/imports.
    const renewablesAndOthers = windProducedMwh + solarMwh + hydroMwh + importsMwh;
    const gasMwh = Math.max(4000, demandMwh - renewablesAndOthers);
    const otherMwh = 800 + rand() * 600;

    points.push({
      date: date.toISOString().slice(0, 10),
      produced: {
        wind: round(windProducedMwh),
        solar: round(solarMwh),
        gas: round(gasMwh),
        hydro: round(hydroMwh),
        coal: 0,
        oil: round(rand() * 300),
        other: round(otherMwh),
        imports: round(importsMwh),
      },
      demandMwh: round(demandMwh),
      windAvailableMwh: round(windAvailableMwh),
    });
  }

  return points;
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function round(v: number): number {
  return Math.round(v);
}
