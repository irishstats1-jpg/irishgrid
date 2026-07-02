import { getSeries, computePeriodMetrics, ALL_PERIODS } from '@/lib/data/metrics';
import { DISPATCH_DOWN_ACTUALS } from '@/lib/data/dispatchDown';
import { GENERATORS } from '@/lib/data/generators';

// Public CSV export for researchers (§15). One endpoint per dataset.
export const revalidate = 3600;

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;
  let rows: Array<Record<string, unknown>> = [];

  switch (dataset) {
    case 'generation-snapshots':
      rows = getSeries().map((d) => ({
        date: d.date,
        demand_mwh: d.demandMwh,
        wind_available_mwh: d.windAvailableMwh,
        wind_mwh: d.produced.wind,
        solar_mwh: d.produced.solar,
        gas_mwh: d.produced.gas,
        hydro_mwh: d.produced.hydro,
        imports_mwh: d.produced.imports,
        other_mwh: d.produced.other,
        wasted_mwh: Math.max(0, d.windAvailableMwh - d.produced.wind),
      }));
      break;
    case 'dispatch-down-actuals':
      rows = DISPATCH_DOWN_ACTUALS.map((a) => ({
        year: a.year,
        region: a.region,
        total_gwh: a.gwh,
        curtailment_gwh: a.curtailmentGwh,
        constraint_gwh: a.constraintGwh,
        wind_dispatch_down_pct: a.windDispatchDownPct,
        source: a.source,
      }));
      break;
    case 'period-metrics':
      rows = ALL_PERIODS.map((p) => {
        const m = computePeriodMetrics(p);
        return {
          period: p,
          is_estimate: m.isEstimate,
          produced_mwh: Math.round(m.producedMwh),
          wasted_mwh: Math.round(m.wastedMwh),
          cost_eur: Math.round(m.costEur),
          cost_per_billpayer_eur: m.costPerBillpayerEur.toFixed(2),
          btc_value_eur: Math.round(m.btcValueEur),
          btc_mined_net: m.btcMinedNet.toFixed(3),
          saving_per_billpayer_eur: m.savingPerBillpayerEur.toFixed(2),
        };
      });
      break;
    case 'generators':
      rows = GENERATORS.map((g) => ({
        id: g.id,
        name: g.name,
        fuel_type: g.fuelType,
        capacity_mw: g.capacityMw,
        operator: g.operator,
        lat: g.lat,
        lng: g.lng,
        region: g.region,
        is_major: g.isMajor,
      }));
      break;
    default:
      return new Response('Unknown dataset', { status: 404 });
  }

  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="irishgrid-${dataset}.csv"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
