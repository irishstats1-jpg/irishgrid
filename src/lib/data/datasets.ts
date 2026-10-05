// Open datasets (Data page and /api/data/[dataset]). Each has a data
// dictionary; the same definitions drive the CSV/JSON export and the page.

import { getAllYears, getBtcMarket } from './metrics';
import { GENERATORS } from './generators';
import { HOUSEHOLDS } from './dispatchDown';
import {
  COST_CASES,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_MINING_COSTS,
  WHOLESALE_REF_EUR_PER_MWH,
} from '../methodology';
import { METHOD_VERSION } from '../site';

export interface Column {
  name: string;
  description: string;
}

export interface Dataset {
  slug: string;
  title: string;
  description: string;
  basis: 'Reported' | 'Modelled' | 'Reported and modelled' | 'Reference';
  columns: Column[];
  rows: () => Array<Record<string, string | number | boolean | null>>;
}

const round = (v: number, dp = 0) => Number(v.toFixed(dp));

export const DATASETS: Dataset[] = [
  {
    slug: 'dispatch-down',
    title: 'Wind dispatch-down, Ireland, by year',
    description: 'The one series the site uses: annual wind dispatch-down in the Republic of Ireland, with its source.',
    basis: 'Reported',
    columns: [
      { name: 'year', description: 'Calendar year' },
      { name: 'method', description: '"reported" (EirGrid/SONI annual report) or "provisional" (report not yet published)' },
      { name: 'wind_dispatch_down_gwh', description: 'Wind dispatch-down (curtailment + constraint), GWh' },
      { name: 'wind_pct_of_available', description: 'Dispatch-down as a percentage of available wind energy' },
      { name: 'constraint_share', description: 'Share caused by constraint rather than curtailment, 0–1; blank when not reported' },
      { name: 'source', description: 'Full citation' },
      { name: 'source_url', description: 'Link to the source document' },
      { name: 'notes', description: 'Caveats' },
    ],
    rows: () =>
      getAllYears().map((m) => ({
        year: m.year,
        method: m.method,
        wind_dispatch_down_gwh: round(m.windMwh / 1000),
        wind_pct_of_available: m.windPctOfAvailable,
        constraint_share: m.constraintShareReported ? round(m.constraintShare, 3) : null,
        source: m.sourceTitle,
        source_url: m.sourceUrl,
        notes: m.notes,
      })),
  },
  {
    slug: 'annual-metrics',
    title: 'Modelled cost and Bitcoin figures, by year',
    description:
      'Compensation cost (low, central, high), the per-household equivalent, and the mining figures at the current market snapshot.',
    basis: 'Reported and modelled',
    columns: [
      { name: 'year', description: 'Calendar year' },
      { name: 'volume_method', description: 'Basis of the volume: "reported" or "provisional"' },
      { name: 'wind_dispatch_down_gwh', description: 'Volume used, GWh (reported or provisional)' },
      { name: 'constraint_share_used', description: 'Constraint share used in the central case, 0–1' },
      { name: 'cost_low_eur', description: 'Modelled compensation, low case, €' },
      { name: 'cost_central_eur', description: 'Modelled compensation, central case, €' },
      { name: 'cost_high_eur', description: 'Modelled compensation, high case, €' },
      { name: 'cost_per_household_central_eur', description: `Central cost ÷ ${HOUSEHOLDS.count} private households (Census 2022), €` },
      { name: 'replacement_cost_eur', description: `Context only: constrained volume × €${WHOLESALE_REF_EUR_PER_MWH}/MWh` },
      { name: 'btc_price_eur', description: 'BTC price used, €' },
      { name: 'network_hashrate_ehs', description: 'Network hashrate used, EH/s' },
      { name: 'market_as_of', description: 'When the market snapshot was taken (ISO 8601)' },
      { name: 'market_live', description: 'false when the stored snapshot was used' },
      { name: 'btc_net', description: 'BTC a fleet would earn from the volume in a year, after pool fee' },
      { name: 'gross_revenue_eur', description: 'Gross mining revenue, before costs, €' },
      { name: 'annual_cost_eur', description: 'Modelled annual cost of the fleet (hardware, site, operations, charges, generator payments), €' },
      { name: 'net_eur', description: 'Gross revenue minus annual cost, €' },
      { name: 'break_even_price_eur', description: 'BTC price at which net = 0, €' },
      { name: 'method_version', description: 'Version of the method that produced the row' },
    ],
    rows: () => {
      const market = getBtcMarket();
      return getAllYears().map((m) => ({
        year: m.year,
        volume_method: m.method,
        wind_dispatch_down_gwh: round(m.windMwh / 1000),
        constraint_share_used: round(m.constraintShare, 3),
        cost_low_eur: round(m.cost.low),
        cost_central_eur: round(m.cost.central),
        cost_high_eur: round(m.cost.high),
        cost_per_household_central_eur: round(m.costPerHousehold.central, 2),
        replacement_cost_eur: round(m.replacementCostEur),
        btc_price_eur: round(market.priceEur),
        network_hashrate_ehs: round(market.networkHashrateThs / 1e6, 1),
        market_as_of: market.asOf,
        market_live: market.live,
        btc_net: round(m.mining.revenue.btcNet, 1),
        gross_revenue_eur: round(m.mining.revenue.revenueEur),
        annual_cost_eur: round(m.mining.totalAnnualCostEur),
        net_eur: round(m.mining.netEur),
        break_even_price_eur: Number.isFinite(m.mining.breakEvenPriceEur) ? round(m.mining.breakEvenPriceEur) : null,
        method_version: METHOD_VERSION,
      }));
    },
  },
  {
    slug: 'assumptions',
    title: 'Assumptions',
    description: 'Every assumption behind the modelled figures, with its value and unit.',
    basis: 'Reference',
    columns: [
      { name: 'key', description: 'Identifier' },
      { name: 'value', description: 'Value' },
      { name: 'unit', description: 'Unit' },
      { name: 'description', description: 'What it is' },
    ],
    rows: () => [
      { key: 'households', value: HOUSEHOLDS.count, unit: 'households', description: HOUSEHOLDS.source },
      ...(['low', 'central', 'high'] as const).flatMap((k) => [
        { key: `cost_${k}_compensation`, value: COST_CASES[k].compensationEurPerMwh, unit: '€/MWh', description: `Compensation rate, ${k} case` },
        { key: `cost_${k}_paid_share_constraint`, value: COST_CASES[k].compensatedShareConstraint, unit: '0–1', description: `Share of constraint compensated, ${k} case` },
        { key: `cost_${k}_paid_share_curtailment`, value: COST_CASES[k].compensatedShareCurtailment, unit: '0–1', description: `Share of curtailment compensated, ${k} case` },
        { key: `cost_${k}_default_constraint_share`, value: COST_CASES[k].defaultConstraintShare, unit: '0–1', description: `Constraint share where not reported, ${k} case` },
      ]),
      { key: 'wholesale_reference', value: WHOLESALE_REF_EUR_PER_MWH, unit: '€/MWh', description: 'Reference wholesale price for the replacement-cost context' },
      { key: 'miner_efficiency', value: DEFAULT_ASSUMPTIONS.efficiencyJPerTh, unit: 'J/TH', description: 'Miner efficiency' },
      { key: 'capture_factor', value: DEFAULT_ASSUMPTIONS.captureFactor, unit: '0–1', description: 'Share of the surplus the fleet uses' },
      { key: 'pool_fee', value: DEFAULT_ASSUMPTIONS.poolFee, unit: '0–1', description: 'Mining pool fee' },
      { key: 'surplus_hours', value: DEFAULT_MINING_COSTS.surplusHoursPerYear, unit: 'hours/year', description: 'Hours a year with surplus; sets fleet size' },
      { key: 'hardware_price', value: DEFAULT_MINING_COSTS.hardwareEurPerThs, unit: '€/(TH/s)', description: 'Mining hardware price' },
      { key: 'hardware_life', value: DEFAULT_MINING_COSTS.hardwareLifeYears, unit: 'years', description: 'Hardware write-off period' },
      { key: 'site_cost', value: DEFAULT_MINING_COSTS.infrastructureEurPerKw, unit: '€/kW', description: 'Containers, transformers and connection' },
      { key: 'site_life', value: DEFAULT_MINING_COSTS.infrastructureLifeYears, unit: 'years', description: 'Site write-off period' },
      { key: 'operations', value: DEFAULT_MINING_COSTS.operatingEurPerMwh, unit: '€/MWh', description: 'Operations, maintenance, staff, insurance' },
      { key: 'network_charges', value: DEFAULT_MINING_COSTS.networkChargesEurPerMwh, unit: '€/MWh', description: 'Network and levy charges' },
      { key: 'generator_payment', value: DEFAULT_MINING_COSTS.energyPaymentEurPerMwh, unit: '€/MWh', description: 'Payment to the generator for surplus power' },
    ],
  },
  {
    slug: 'generators',
    title: 'Generators on the map',
    description: 'The curated, partial list of large generators and interconnectors shown on the map. Locations are approximate.',
    basis: 'Reference',
    columns: [
      { name: 'id', description: 'Identifier' },
      { name: 'name', description: 'Name' },
      { name: 'fuel_type', description: 'wind, gas, oil, hydro, storage, solar, imports (interconnector) or other' },
      { name: 'capacity_mw', description: 'Installed or rated capacity, MW' },
      { name: 'operator', description: 'Operator' },
      { name: 'lat', description: 'Latitude (approximate)' },
      { name: 'lng', description: 'Longitude (approximate)' },
      { name: 'region', description: 'County' },
      { name: 'is_major', description: 'Shown on the default map' },
      { name: 'note', description: 'Status note' },
    ],
    rows: () =>
      GENERATORS.map((g) => ({
        id: g.id,
        name: g.name,
        fuel_type: g.fuelType,
        capacity_mw: g.capacityMw,
        operator: g.operator,
        lat: g.lat,
        lng: g.lng,
        region: g.region,
        is_major: g.isMajor,
        note: g.note ?? null,
      })),
  },
];

/** Old dataset slugs, kept working for anyone who linked them. */
export const DATASET_ALIASES: Record<string, string> = {
  'dispatch-down-actuals': 'dispatch-down',
  'period-metrics': 'annual-metrics',
};

export const DATA_LICENCE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: 'Irish Grid (irishgrid.com), from EirGrid/SONI and CSO data',
} as const;

export function toCsv(rows: Array<Record<string, unknown>>, columns: Column[]): string {
  const headers = columns.map((c) => c.name);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}
