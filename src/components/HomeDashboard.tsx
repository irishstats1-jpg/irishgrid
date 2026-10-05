'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PeriodKey, FuelType } from '@/lib/methodology/types';
import type { PeriodMetrics } from '@/lib/data/metrics';
import { GENERATORS } from '@/lib/data/generators';
import { IrelandMap, type MapGenerator } from './IrelandMap';
import { FuelMixChart, FuelMixDonut, MoneyChart } from './charts';
import { NotFinancialAdvice, PairedFigure, TagRow, Takeaway, WhyDiffer } from './ui';
import { eur, energy, num } from '@/lib/format';
import { approx, btcFigure, btcTags, costTags, methodTag, PERIOD_TAG, volumeTags } from '@/lib/basis';
import {
  computeBtcSavings,
  computeCost,
  computeReplacementCost,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COST_ASSUMPTIONS,
  FALLBACK_BTC_MARKET,
  WHOLESALE_REF_EUR_PER_MWH,
} from '@/lib/methodology';

type Denom = 'household' | 'person';

export function HomeDashboard({
  metricsByPeriod,
  seriesByPeriod,
  periods,
  headlinePeriod,
  btcPriceEur,
  asOf,
}: {
  metricsByPeriod: Record<string, PeriodMetrics>;
  seriesByPeriod: Record<string, Array<Record<string, number | string>>>;
  periods: PeriodKey[];
  /** The period the hero's headline figures use — differing views get a note. */
  headlinePeriod: PeriodKey;
  btcPriceEur: number;
  asOf: string;
}) {
  const td = useTranslations('durations');
  const [period, setPeriod] = useState<PeriodKey>(headlinePeriod);
  const [denom, setDenom] = useState<Denom>('household');
  const [detailed, setDetailed] = useState(false);

  const m = metricsByPeriod[period];
  const headline = metricsByPeriod[headlinePeriod];
  const series = useMemo(() => seriesByPeriod[period] ?? [], [seriesByPeriod, period]);

  // Modelled per-plant output (pro-rate fuel-type system generation by capacity).
  const mapGenerators: MapGenerator[] = useMemo(() => {
    const list = detailed ? GENERATORS : GENERATORS.filter((g) => g.isMajor);
    const fuelInstalled: Partial<Record<FuelType, number>> = {};
    for (const g of GENERATORS) fuelInstalled[g.fuelType] = (fuelInstalled[g.fuelType] ?? 0) + g.capacityMw;
    return list.map((g) => {
      const share = g.capacityMw / (fuelInstalled[g.fuelType] || g.capacityMw);
      return {
        ...g,
        modelledOutputMwh: (m.sourceBreakdown[g.fuelType] ?? 0) * share,
        attributableWastedMwh: g.fuelType === 'wind' ? m.wastedMwh * share : 0,
      };
    });
  }, [detailed, m]);

  // "Per household" is the plain-English headline (≈2.1m households); "per
  // person" (≈5.3m) is the alternative view.
  const nDenom = denom === 'household' ? DEFAULT_ASSUMPTIONS.nHouseholds : DEFAULT_ASSUMPTIONS.nPeople;
  const costPer = m.costEur / nDenom;
  const savingPer = m.btcValueEur / nDenom;
  const wastedShare = m.producedMwh > 0 ? (m.wastedMwh / (m.producedMwh + m.wastedMwh)) * 100 : 0;
  const replacementCost = computeReplacementCost(m.wastedMwh, WHOLESALE_REF_EUR_PER_MWH);

  // Aggregate the daily series into a few readable buckets (365 daily points
  // are unreadable). Coal/oil are folded into "other" for the same reason.
  const { mixSeries, moneySeries } = useMemo(() => {
    if (series.length === 0) return { mixSeries: [], moneySeries: [] };
    const monthly = series.length > 31;
    const buckets = new Map<string, { days: number; wind: number; solar: number; hydro: number; imports: number; gas: number; other: number; wasted: number }>();
    const label = (iso: string) => {
      if (!monthly) return iso.slice(5); // mm-dd
      const d = new Date(iso);
      return d.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    };
    for (const d of series) {
      const key = label(d.date as string);
      const b = buckets.get(key) ?? { days: 0, wind: 0, solar: 0, hydro: 0, imports: 0, gas: 0, other: 0, wasted: 0 };
      b.days += 1;
      b.wind += Number(d.wind) || 0;
      b.solar += Number(d.solar) || 0;
      b.hydro += Number(d.hydro) || 0;
      b.imports += Number(d.imports) || 0;
      b.gas += Number(d.gas) || 0;
      b.other += (Number(d.other) || 0) + (Number(d.oil) || 0) + (Number(d.coal) || 0);
      b.wasted += Number(d.wasted) || 0;
      buckets.set(key, b);
    }
    const mixSeries: Array<Record<string, number | string>> = [];
    const moneySeries: Array<{ date: string; cost: number; saved: number }> = [];
    const denominators = { nBillpayers: DEFAULT_ASSUMPTIONS.nBillpayers, nPeople: DEFAULT_ASSUMPTIONS.nPeople };
    buckets.forEach((b, date) => {
      mixSeries.push({ date, wind: b.wind, solar: b.solar, hydro: b.hydro, imports: b.imports, gas: b.gas, other: b.other });
      const cost = computeCost({ totalMwh: b.wasted }, DEFAULT_COST_ASSUMPTIONS, denominators);
      const btc = computeBtcSavings(b.wasted, b.days * 24, DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET);
      moneySeries.push({ date, cost: Math.round(cost.costEur), saved: Math.round(btc.valueEur) });
    });
    return { mixSeries, moneySeries };
  }, [series]);

  const cleanShare =
    m.producedMwh > 0 ? ((m.sourceBreakdown.wind + m.sourceBreakdown.solar + m.sourceBreakdown.hydro) / m.producedMwh) * 100 : 0;

  return (
    <div>
      {/* Period selector */}
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Period">
        <span className="eyebrow mr-1">Period</span>
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={p === period}
            className={`min-h-[36px] rounded-sm border px-3 py-1.5 font-display text-[15px] font-semibold tracking-[0.02em] transition ${
              p === period ? 'border-peat bg-peat text-white' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-100'
            }`}
          >
            {td(p)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card self-start lg:sticky lg:top-24">
          <IrelandMap generators={mapGenerators} detailed={detailed} onToggleDetailed={() => setDetailed((v) => !v)} />
        </div>

        <aside className="card space-y-5" aria-label="Grid statistics for selected period">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[26px] leading-none">The numbers</h2>
            <div className="flex rounded-sm border border-ink-200 font-display text-[14px]" role="group" aria-label="Per">
              {(['household', 'person'] as Denom[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDenom(d)}
                  aria-pressed={denom === d}
                  className={`min-h-[32px] px-2.5 py-1 font-semibold ${denom === d ? 'bg-green-700 text-white' : 'text-ink-700'}`}
                >
                  per {d}
                </button>
              ))}
            </div>
          </div>

          <TagRow
            tags={[
              { kind: 'period', label: PERIOD_TAG[period] },
              { kind: 'scope', label: 'Republic only' },
              { kind: 'method', label: methodTag(m) },
            ]}
          />

          <div>
            <p className="text-sm text-ink-600">Total electricity generated</p>
            <p className="figure text-[34px] text-ink">≈ {energy(m.producedMwh)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-700">Where it came from</p>
            <FuelMixDonut breakdown={m.sourceBreakdown} />
          </div>

          <PairedFigure
            stacked
            size="sm"
            green={{
              label: 'Clean energy wasted',
              value: `${approx(m)}${energy(m.wastedMwh)}`,
              gloss: `≈ ${num(wastedShare, 1)}% of all electricity generated`,
              tags: volumeTags(m),
            }}
            orange={{
              label: 'If that surplus had mined Bitcoin',
              value: `≈ ${btcFigure(m.btcMinedNet)}`,
              gloss: `≈ ${eur(m.btcValueEur, { compact: true })} of recoverable value`,
              tags: btcTags(m),
            }}
          />

          <PairedFigure
            stacked
            size="sm"
            green={{
              label: `Paid out · per ${denom}`,
              value: `≈ ${eur(costPer)}`,
              gloss: (
                <>
                  ≈ {eur(m.costEur, { compact: true })} in compensation in total — and replacing the lost power with gas
                  costs ≈ {eur(replacementCost, { compact: true })} more.
                </>
              ),
              tags: costTags(m),
            }}
            orange={{
              label: `Recoverable · per ${denom}`,
              value: `≈ ${eur(savingPer)}`,
              gloss: `≈ ${eur(m.btcValueEur, { compact: true })} across all ${denom === 'household' ? 'households' : 'people'}`,
              tags: btcTags(m),
            }}
          />

          {period !== headlinePeriod && (
            <WhyDiffer>
              The headline above is {PERIOD_TAG[headlinePeriod].toLowerCase()} ({methodTag(headline).toLowerCase()});
              this panel shows {PERIOD_TAG[period].toLowerCase()} ({methodTag(m).toLowerCase()}).
            </WhyDiffer>
          )}

          <NotFinancialAdvice priceEur={btcPriceEur} asOf={asOf} />
        </aside>
      </div>

      {mixSeries.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="text-[22px]">Where Ireland&apos;s electricity came from</h3>
            <TagRow tags={[{ kind: 'period', label: PERIOD_TAG[period] }, { kind: 'method', label: 'Modelled' }]} className="mt-2" />
            <FuelMixChart data={mixSeries} />
            <Takeaway>
              Clean sources supplied ≈ {num(cleanShare, 0)}% over this period. When the wind drops, gas (grey) fills the
              gap — and when there&apos;s more wind than the grid can take, some of it is switched off.
            </Takeaway>
          </div>
          <div className="card">
            <h3 className="text-[22px]">The money: what the waste cost, and what it could have earned</h3>
            <TagRow
              tags={[
                { kind: 'period', label: PERIOD_TAG[period] },
                { kind: 'method', label: 'Modelled' },
                { kind: 'mined', label: '† If mined' },
              ]}
              className="mt-2"
            />
            <MoneyChart data={moneySeries} />
            <Takeaway>
              Over this period ≈ {eur(m.costEur, { compact: true })} was paid out for energy that was switched off —
              while the same surplus could have earned ≈ {eur(m.btcValueEur, { compact: true })}.†
            </Takeaway>
          </div>
        </div>
      )}
    </div>
  );
}
