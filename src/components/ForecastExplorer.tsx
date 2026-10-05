'use client';

import { useMemo, useState } from 'react';
import { computeForecast, DEFAULT_ASSUMPTIONS, DEFAULT_FORECAST_CONFIG, FALLBACK_BTC_MARKET } from '@/lib/methodology';
import type { BtcMarket } from '@/lib/methodology/types';
import { ForecastChart, RevenueChart } from './charts';
import { eurModel, num, pct } from '@/lib/format';
import { Callout } from './ui';

const PATHWAYS = [
  { key: 1.0, label: 'Published targets' },
  { key: 1.3, label: 'Faster' },
  { key: 0.7, label: 'Slower' },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-medium text-ink-800">
        <span>{label}</span>
        <span className="tabular-nums text-green-700">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-green-600"
      />
    </label>
  );
}

/** Scenario explorer: dispatch-down on a business-as-usual grid, and what flexible demand could use. */
export function ForecastExplorer({ market = FALLBACK_BTC_MARKET }: { market?: BtcMarket }) {
  const [pathway, setPathway] = useState(1.0);
  const [absorbed, setAbsorbed] = useState(DEFAULT_FORECAST_CONFIG.flexibleAbsorbedShare);
  const [slope, setSlope] = useState(DEFAULT_FORECAST_CONFIG.dispatchDownSlopePerGw);
  const [networkGrowth, setNetworkGrowth] = useState(DEFAULT_FORECAST_CONFIG.networkGrowth);
  const [priceGrowth, setPriceGrowth] = useState(DEFAULT_FORECAST_CONFIG.priceGrowth);

  const points = useMemo(() => {
    const cfg = {
      ...DEFAULT_FORECAST_CONFIG,
      pathwayMultiplier: pathway,
      flexibleAbsorbedShare: absorbed,
      dispatchDownSlopePerGw: slope,
      networkGrowth,
      priceGrowth,
    };
    return computeForecast('with_flexible_demand', cfg, DEFAULT_ASSUMPTIONS, market);
  }, [pathway, absorbed, slope, networkGrowth, priceGrowth, market]);

  const last = points[points.length - 1];
  const milestones = points.filter((p) => p.year % 5 === 0 || p.year === points[0].year);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="card">
          <h3 className="text-[22px]">Dispatch-down, and the share flexible demand could use</h3>
          <ForecastChart
            data={points.map((p) => ({ year: p.year, dispatchDownGwh: Math.round(p.dispatchDownGwh), absorbedGwh: Math.round(p.absorbedGwh) }))}
          />
        </div>
        <div className="card">
          <h3 className="text-[22px]">Gross mining revenue from that energy, before costs†</h3>
          <p className="mt-1 text-[13px] text-ink-600">
            The steps are the halvings (2028, 2032, …): each one halves the new bitcoin issued per block, so the same
            energy earns less unless the price rises.
          </p>
          <RevenueChart data={points.map((p) => ({ year: p.year, grossRevenueEur: p.grossRevenueEur }))} />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="mb-3 text-[22px]">Milestones</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-600">
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4">Wind + solar</th>
                <th className="py-2 pr-4">Dispatch-down rate</th>
                <th className="py-2 pr-4">Dispatch-down</th>
                <th className="py-2 pr-4">Block subsidy</th>
                <th className="py-2">Gross revenue†</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((p) => (
                <tr key={p.year} className="border-b border-ink-200">
                  <td className="py-2 pr-4 font-medium">{p.year}</td>
                  <td className="py-2 pr-4 tabular-nums">{num(p.renewableCapacityGw, 0)} GW</td>
                  <td className="py-2 pr-4 tabular-nums">{pct(p.dispatchDownRate * 100, 0)}</td>
                  <td className="py-2 pr-4 tabular-nums text-green-700">{num(p.dispatchDownGwh / 1000, 1)} TWh</td>
                  <td className="py-2 pr-4 tabular-nums">{num(p.blockRewardBtc, 3)} BTC</td>
                  <td className="py-2 tabular-nums text-orange-700">≈ {eurModel(p.grossRevenueEur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="min-w-0 space-y-5">
        <div className="card space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">Build-out pace</p>
            <div className="flex flex-wrap gap-2">
              {PATHWAYS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPathway(p.key)}
                  aria-pressed={pathway === p.key}
                  className={`rounded-sm border px-3 py-1.5 text-xs font-medium ${
                    pathway === p.key ? 'border-peat bg-peat text-white' : 'border-ink-200 bg-white text-ink-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Slider label="Share used by flexible demand" value={absorbed} min={0} max={1} step={0.05} onChange={setAbsorbed} format={(v) => pct(v * 100, 0)} />
          <Slider label="Dispatch-down rise per extra GW" value={slope} min={0} max={0.02} step={0.001} onChange={setSlope} format={(v) => `${pct(v * 100, 1)} pts`} />
          <Slider label="Network hashrate growth a year" value={networkGrowth} min={0} max={0.4} step={0.01} onChange={setNetworkGrowth} format={(v) => pct(v * 100, 0)} />
          <Slider label="BTC price change a year" value={priceGrowth} min={-0.1} max={0.3} step={0.01} onChange={setPriceGrowth} format={(v) => pct(v * 100, 0)} />
        </div>

        <Callout tone="info" title={`In ${last.year}, in this scenario`}>
          <ul className="space-y-1">
            <li>Wind and solar: <strong>{num(last.renewableCapacityGw, 0)} GW</strong></li>
            <li>Dispatch-down: <strong>{num(last.dispatchDownGwh / 1000, 1)} TWh</strong> ({pct(last.dispatchDownRate * 100, 0)})</li>
            <li>Gross revenue: <strong>≈ {eurModel(last.grossRevenueEur)}</strong>†, before costs</li>
          </ul>
        </Callout>
        <p className="text-[12px] leading-relaxed text-ink-600">
          † A scenario, not a forecast. Capacity follows published targets; the dispatch-down rate starts at the 2024
          reported rate and rises with capacity on a grid that is not reinforced — new wires, storage and
          interconnectors would lower it. Revenue starts from the BTC price and network on the date shown and
          excludes all costs and transaction fees. Not financial advice.
        </p>
      </aside>
    </div>
  );
}
