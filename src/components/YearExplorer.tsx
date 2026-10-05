'use client';

import { useState } from 'react';
import type { YearMetrics } from '@/lib/data/metrics';
import type { BtcMarket } from '@/lib/methodology/types';
import { DispatchDownBars } from './charts';
import { PairedFigure, SingleFigure, TagRow, WhyDiffer } from './ui';
import { eurModel, eurRange, gwh, pct } from '@/lib/format';
import { approx, btcFigure, btcTags, costTags, methodTag, periodTag, volumeTags } from '@/lib/basis';

// Year-by-year view of the one series the site uses: Ireland, wind, calendar
// years, as reported by EirGrid (the latest year provisional until its report
// is out). Pick a year to see its modelled cost and the Bitcoin counterpart.
export function YearExplorer({
  years,
  headlineYear,
  market,
}: {
  /** Newest first. */
  years: YearMetrics[];
  headlineYear: number;
  market: BtcMarket;
}) {
  const [selected, setSelected] = useState(headlineYear);
  const y = years.find((m) => m.year === selected) ?? years[0];
  const headline = years.find((m) => m.year === headlineYear) ?? years[0];
  const ascending = [...years].reverse();
  const provisional = ascending.filter((m) => m.method !== 'reported');

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="card self-start">
        <h3 className="text-[22px]">Wind power turned away in Ireland, GWh</h3>
        <TagRow
          className="mt-2"
          tags={[
            { kind: 'period', label: `Calendar ${ascending[0]?.year}–${ascending[ascending.length - 1]?.year}` },
            { kind: 'scope', label: 'Ireland · wind' },
            { kind: 'method', label: 'Reported · EirGrid C&C reports' },
          ]}
        />
        <div className="mt-4">
          <DispatchDownBars
            data={ascending.map((m) => ({
              year: m.year,
              gwh: m.windMwh / 1000,
              pct: m.windPctOfAvailable,
              provisional: m.method !== 'reported',
            }))}
            selectedYear={selected}
            onSelect={setSelected}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Year">
          {ascending.map((m) => (
            <button
              key={m.year}
              type="button"
              onClick={() => setSelected(m.year)}
              aria-pressed={m.year === selected}
              className={`min-h-[36px] rounded-sm border px-3 py-1.5 font-display text-[15px] font-semibold tracking-[0.02em] transition ${
                m.year === selected ? 'border-peat bg-peat text-white' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-100'
              }`}
            >
              {m.year}
              {m.method !== 'reported' && <span className="ml-1 font-sans text-[12px] font-normal">(provisional)</span>}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-600">
          {provisional.map((m) => (
            <span key={m.year}>
              {m.year} (pale bar) is provisional: {m.notes}{' '}
            </span>
          ))}
          {ascending.some((m) => m.year === 2020) && '2020 was high because Covid-19 lockdowns cut demand.'}
        </p>
      </div>

      <aside className="min-w-0 space-y-5" aria-label={`Figures for ${y.year}`}>
        <PairedFigure
          stacked
          size="sm"
          green={{
            label: 'Wind power turned away',
            value: `${approx(y)}${gwh(y.windMwh)}`,
            gloss:
              y.windPctOfAvailable !== null
                ? `${pct(y.windPctOfAvailable)} of the wind energy available in Ireland`
                : 'Share of available wind not reported',
            tags: volumeTags(y),
          }}
          orange={{
            label: 'The same energy, mined at today’s network',
            value: `≈ ${eurModel(y.mining.revenue.revenueEur)}`,
            gloss: `≈ ${btcFigure(y.mining.revenue.btcNet)} gross revenue, before hardware, power and running costs`,
            tags: btcTags(market),
          }}
        />

        <SingleFigure
          side={{
            label: 'Compensation paid for it',
            value: `≈ ${eurModel(y.cost.central)}`,
            gloss: (
              <>
                Modelled range {eurRange(y.cost.low, y.cost.high)} — equivalent to ≈ {eurModel(y.costPerHousehold.central)}{' '}
                per household ({eurRange(y.costPerHousehold.low, y.costPerHousehold.high)}).{' '}
                {y.constraintShareReported
                  ? `The report gives the split: ${pct(y.constraintShare * 100, 0)} constraint.`
                  : 'The split between curtailment and constraint is not captured for this year, so the range also spans the split.'}
              </>
            ),
            tags: costTags(y),
          }}
        />

        {y.year !== headline.year && (
          <WhyDiffer>
            The headline on this page is {periodTag(headline).toLowerCase()} ({methodTag(headline).toLowerCase()}); this
            panel shows {periodTag(y).toLowerCase()} ({methodTag(y).toLowerCase()}).
          </WhyDiffer>
        )}
      </aside>
    </div>
  );
}
