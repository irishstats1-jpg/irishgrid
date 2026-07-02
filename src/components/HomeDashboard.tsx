'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PeriodKey, FuelType } from '@/lib/methodology/types';
import type { PeriodMetrics } from '@/lib/data/metrics';
import { GENERATORS, FUEL_LABELS } from '@/lib/data/generators';
import { IrelandMap, type MapGenerator } from './IrelandMap';
import { FuelMixChart, FuelMixDonut, MoneyChart } from './charts';
import { EstimateBadge, ActualBadge, NotFinancialAdvice, Takeaway } from './ui';
import { eur, energy, num } from '@/lib/format';
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
}: {
  metricsByPeriod: Record<string, PeriodMetrics>;
  seriesByPeriod: Record<string, Array<Record<string, number | string>>>;
  periods: PeriodKey[];
}) {
  const td = useTranslations('durations');
  const [period, setPeriod] = useState<PeriodKey>('2025');
  const [denom, setDenom] = useState<Denom>('household');
  const [detailed, setDetailed] = useState(false);

  const m = metricsByPeriod[period];
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

  // "Per household" is the layman-friendly headline (≈2.1m households, an
  // assumptions-table value); "per person" (≈5.3m) is the alternative view.
  const costPer =
    denom === 'household' ? m.costEur / DEFAULT_ASSUMPTIONS.nHouseholds : m.costPerPersonEur;
  const savingPer =
    denom === 'household' ? m.btcValueEur / DEFAULT_ASSUMPTIONS.nHouseholds : m.savingPerPersonEur;
  const wastedShare = m.producedMwh > 0 ? (m.wastedMwh / (m.producedMwh + m.wastedMwh)) * 100 : 0;
  const replacementCost = computeReplacementCost(m.wastedMwh, WHOLESALE_REF_EUR_PER_MWH);

  // Aggregate the daily series into a small number of readable buckets
  // (365 daily points are unreadable — a policymaker should be able to take the
  // chart in at a glance). Fuels are grouped (coal/oil → other) for the same reason.
  const { mixSeries, moneySeries } = useMemo(() => {
    if (series.length === 0) return { mixSeries: [], moneySeries: [] };
    // ≤ 31 points → daily; otherwise bucket by calendar month.
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

  const windShare = m.producedMwh > 0
    ? ((m.sourceBreakdown.wind + m.sourceBreakdown.solar + m.sourceBreakdown.hydro) / m.producedMwh) * 100
    : 0;

  return (
    <div>
      {/* Duration toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-navy-700">Period:</span>
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              p === period ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
            }`}
          >
            {td(p)}
          </button>
        ))}
        <span className="ml-1">{m.isEstimate ? <EstimateBadge /> : <ActualBadge />}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Map */}
        <div className="card">
          <IrelandMap generators={mapGenerators} detailed={detailed} onToggleDetailed={() => setDetailed((v) => !v)} />
        </div>

        {/* Stats panel */}
        <aside className="card space-y-4" aria-label="Grid statistics for selected period">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">The numbers</h2>
            <div className="flex rounded-md border border-navy-200 text-xs">
              {(['household', 'person'] as Denom[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDenom(d)}
                  className={`px-2 py-1 font-medium ${denom === d ? 'bg-sky-500 text-white' : 'text-navy-700'}`}
                >
                  per {d}
                </button>
              ))}
            </div>
          </div>

          <Stat label="Total energy produced" value={energy(m.producedMwh)} />

          <div>
            <p className="text-sm font-medium text-navy-700">Breakdown by source</p>
            <FuelMixDonut breakdown={m.sourceBreakdown} />
          </div>

          <Stat
            label="Clean energy wasted (dispatched down)"
            value={energy(m.wastedMwh)}
            sub={`≈ ${num(wastedShare, 1)}% of output`}
            tone="warn"
          />
          <Stat
            label="Paid out for that switched-off energy"
            value={eur(m.costEur, { compact: true })}
            sub={`compensation only — replacing it with gas cost ≈ ${eur(replacementCost, { compact: true })} more`}
            tone="warn"
          />
          <Stat label={`Cost per ${denom}`} value={eur(costPer)} tone="warn" />

          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="text-sm font-semibold text-navy-900">If that surplus had mined Bitcoin</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat label="Recoverable value" value={eur(m.btcValueEur, { compact: true })} tone="good" compact />
              <Stat label={`Saved per ${denom}`} value={eur(savingPer)} tone="good" compact />
            </div>
            <p className="mt-1 text-xs text-navy-600">{num(m.btcMinedNet, 1)} BTC mined (net of pool fee)</p>
          </div>

          <NotFinancialAdvice />
        </aside>
      </div>

      {/* Below the fold: two digestible charts that carry the story */}
      {mixSeries.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Where Ireland&apos;s electricity came from</h3>
            <FuelMixChart data={mixSeries} />
            <Takeaway>
              Clean sources supplied ≈ {num(windShare, 0)}% over this period. Whenever the wind drops, gas
              (orange) fills the gap — and when there&apos;s too much wind, we switch it off.
            </Takeaway>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">The money: what waste cost vs what it could earn</h3>
            <MoneyChart data={moneySeries} />
            <Takeaway>
              Over this period, ≈ {eur(m.costEur, { compact: true })} was paid out for energy we threw away —
              while the same surplus could have earned ≈ {eur(m.btcValueEur, { compact: true })}.
            </Takeaway>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'default',
  compact = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'warn' | 'good';
  compact?: boolean;
}) {
  const toneClass = tone === 'warn' ? 'text-orange-700' : tone === 'good' ? 'text-emerald-700' : 'text-navy-900';
  return (
    <div>
      <p className="text-sm text-navy-600">{label}</p>
      <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-navy-500">{sub}</p>}
    </div>
  );
}
