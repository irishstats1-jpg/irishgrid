import type { YearMetrics } from '@/lib/data/metrics';
import { eurModel, eurRange, gwh, pct } from '@/lib/format';
import { approx } from '@/lib/basis';
import { BasisTag } from './ui';

const TH = 'py-2 pr-4 font-display text-[14px] font-semibold text-ink-700';

/** Year-by-year volume and modelled cost. Volumes are reported; every € is modelled (≈). */
export function AnnualTable({ years }: { years: YearMetrics[] }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Wind dispatch-down in Ireland and its modelled cost, by year</caption>
          <thead>
            <tr className="border-b border-ink-700 text-left">
              <th scope="col" className={TH}>Year</th>
              <th scope="col" className={`${TH} text-right`}>Wind turned away</th>
              <th scope="col" className={`${TH} text-right`}>Share of available wind</th>
              <th scope="col" className={`${TH} text-right`}>Compensation (modelled)</th>
              <th scope="col" className={`${TH} text-right`}>Per household</th>
              <th scope="col" className={TH}>Volume basis</th>
            </tr>
          </thead>
          <tbody>
            {years.map((m) => (
              <tr key={m.year} className="border-b border-ink-200">
                <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{m.year}</th>
                <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-green-700">
                  {approx(m)}
                  {gwh(m.windMwh)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {m.windPctOfAvailable !== null ? pct(m.windPctOfAvailable) : '—'}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  ≈ {eurModel(m.cost.central)}
                  <span className="block text-[12px] text-ink-500">{eurRange(m.cost.low, m.cost.high)}</span>
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  ≈ {eurModel(m.costPerHousehold.central)}
                  <span className="block text-[12px] text-ink-500">
                    {eurRange(m.costPerHousehold.low, m.costPerHousehold.high)}
                  </span>
                </td>
                <td className="py-2.5">
                  <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <BasisTag kind="method">{m.method === 'reported' ? m.source : 'Provisional'}</BasisTag>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-600">
        Volumes are wind only, Republic of Ireland, from EirGrid and SONI&apos;s annual Constraint and Curtailment
        reports; the latest year is provisional until its report is published. Every € figure is modelled: a central
        estimate with a low–high range, rounded to two significant figures. &ldquo;Per household&rdquo; divides the
        total by 1,841,152 private households (Census 2022) — it is an equivalent, not a line on any bill.
      </p>
    </div>
  );
}
