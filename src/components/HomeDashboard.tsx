'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PeriodKey, FuelType } from '@/lib/methodology/types';
import type { PeriodMetrics } from '@/lib/data/metrics';
import { GENERATORS, FUEL_LABELS } from '@/lib/data/generators';
import { IrelandMap, type MapGenerator } from './IrelandMap';
import { FuelMixChart, FuelMixDonut, TrendChart } from './charts';
import { EstimateBadge, ActualBadge, NotFinancialAdvice, Takeaway } from './ui';
import { eur, energy, num } from '@/lib/format';
import {
  computeBtcSavings,
  computeCost,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COST_ASSUMPTIONS,
  FALLBACK_BTC_MARKET,
} from '@/lib/methodology';

type Denom = 'billpayer' | 'person';

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
  const [period, setPeriod] = useState<PeriodKey>('last_week');
  const [denom, setDenom] = useState<Denom>('billpayer');
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

  const costPer = denom === 'billpayer' ? m.costPerBillpayerEur : m.costPerPersonEur;
  const savingPer = denom === 'billpayer' ? m.savingPerBillpayerEur : m.savingPerPersonEur;
  const wastedShare = m.producedMwh > 0 ? (m.wastedMwh / (m.producedMwh + m.wastedMwh)) * 100 : 0;

  // Derived daily trends for the cost + could-have-saved charts (§5.1). Each day's
  // wasted energy runs through the same cost and BTC-savings model as the panel.
  const derivedSeries = useMemo(
    () =>
      series.map((d) => {
        const wasted = Number(d.wasted) || 0;
        const cost = computeCost({ totalMwh: wasted }, DEFAULT_COST_ASSUMPTIONS, {
          nBillpayers: DEFAULT_ASSUMPTIONS.nBillpayers,
          nPeople: DEFAULT_ASSUMPTIONS.nPeople,
        });
        const btc = computeBtcSavings(wasted, 24, DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET);
        return { date: d.date as string, cost: Math.round(cost.costEur), saved: Math.round(btc.valueEur) };
      }),
    [series],
  );

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
              {(['billpayer', 'person'] as Denom[]).map((d) => (
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
          <Stat label="Curtailment / constraint payments" value={eur(m.costEur, { compact: true })} tone="warn" />
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

      {/* Below the fold: supporting charts */}
      {series.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Fuel mix over time</h3>
            <FuelMixChart data={series} />
            <Takeaway>
              Gas fills the gap whenever wind and solar fall short — and wind is dialled back when there&apos;s too much of it.
            </Takeaway>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Wasted (dispatched-down) energy</h3>
            <TrendChart data={series} dataKey="wasted" color="#e06d3b" yFormat={(v) => `${Math.round(v).toLocaleString()} MWh`} />
            <Takeaway>Every spike is clean electricity Ireland generated but couldn&apos;t use.</Takeaway>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Cost to billpayers</h3>
            <TrendChart data={derivedSeries} dataKey="cost" color="#c2410c" yFormat={(v) => eur(v, { compact: true })} />
            <Takeaway>Modelled compensation for dispatched-down energy — money that lands on bills.</Takeaway>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Could have been saved (mined BTC)</h3>
            <TrendChart data={derivedSeries} dataKey="saved" color="#059669" yFormat={(v) => eur(v, { compact: true })} />
            <Takeaway>The value flexible mining could have recovered from the same surplus.</Takeaway>
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
