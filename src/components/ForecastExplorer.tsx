'use client';

import { useMemo, useState } from 'react';
import {
  computeForecast,
  DEFAULT_FORECAST_CONFIG,
  DEFAULT_ASSUMPTIONS,
  FALLBACK_BTC_MARKET,
} from '@/lib/methodology';
import { ForecastChart, SavingsChart } from './charts';
import { eur, num, pct } from '@/lib/format';
import { Callout, NotFinancialAdvice } from './ui';

const PATHWAYS = [
  { key: 1.0, label: 'Balanced' },
  { key: 1.3, label: 'Faster offshore' },
  { key: 0.7, label: 'Slower / constrained' },
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
      <span className="flex justify-between text-sm font-medium text-navy-800">
        <span>{label}</span>
        <span className="text-sky-600">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-sky-500"
      />
    </label>
  );
}

export function ForecastExplorer() {
  const [pathway, setPathway] = useState(1.0);
  const [absorbed, setAbsorbed] = useState(DEFAULT_FORECAST_CONFIG.miningAbsorbedShare);
  const [ddSlope, setDdSlope] = useState(DEFAULT_FORECAST_CONFIG.curtailmentSlopePerGw);
  const [btcPrice, setBtcPrice] = useState(FALLBACK_BTC_MARKET.priceEur);
  const [efficiency, setEfficiency] = useState(DEFAULT_ASSUMPTIONS.efficiencyJPerTh);
  const [households, setHouseholds] = useState(DEFAULT_ASSUMPTIONS.nHouseholds);

  const { chartData, savingsData, summary } = useMemo(() => {
    const cfg = {
      ...DEFAULT_FORECAST_CONFIG,
      pathwayMultiplier: pathway,
      miningAbsorbedShare: absorbed,
      curtailmentSlopePerGw: ddSlope,
    };
    const assumptions = { ...DEFAULT_ASSUMPTIONS, efficiencyJPerTh: efficiency, nHouseholds: households };
    const market = { ...FALLBACK_BTC_MARKET, priceEur: btcPrice };

    const bau = computeForecast('bau', cfg, assumptions, market);
    const mining = computeForecast('with_mining', cfg, assumptions, market);

    const chartData = bau.map((b, i) => ({
      year: b.year,
      curtailmentGwh: Math.round(b.curtailmentGwh),
      recoveredGwh: Math.round(mining[i].recoveredGwh),
    }));
    const savingsData = mining.map((m) => ({
      year: m.year,
      savingPerHouseholdEur: Number(m.savingPerHouseholdEur.toFixed(2)),
    }));
    const last = mining[mining.length - 1];
    const summary = {
      year: last.year,
      capacity: last.renewableCapacityGw,
      penetration: last.penetrationPct,
      curtailment: last.curtailmentGwh,
      recoveredValue: last.recoveredValueEur,
      savingPerHousehold: last.savingPerHouseholdEur,
      points: mining,
    };
    return { chartData, savingsData, summary };
  }, [pathway, absorbed, ddSlope, btcPrice, efficiency, households]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-navy-900">Curtailment vs energy recovered by mining</h3>
          <ForecastChart data={chartData} />
        </div>
        <div className="card">
          <h3 className="font-semibold text-navy-900">Savings per household</h3>
          <SavingsChart data={savingsData} />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="mb-3 font-semibold text-navy-900">By year (selected milestones)</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-navy-200 text-left text-navy-600">
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4">Renewables</th>
                <th className="py-2 pr-4">% of demand</th>
                <th className="py-2 pr-4">Curtailment</th>
                <th className="py-2 pr-4">Recovered value</th>
                <th className="py-2">Saved / household</th>
              </tr>
            </thead>
            <tbody>
              {summary.points
                .filter((p) => p.year % 5 === 0 || p.year === summary.year)
                .map((p) => (
                  <tr key={p.year} className="border-b border-navy-100">
                    <td className="py-2 pr-4 font-medium">{p.year}</td>
                    <td className="py-2 pr-4">{num(p.renewableCapacityGw, 1)} GW</td>
                    <td className="py-2 pr-4">{pct(p.penetrationPct, 0)}</td>
                    <td className="py-2 pr-4 text-orange-700">{num(p.curtailmentGwh / 1000, 1)} TWh</td>
                    <td className="py-2 pr-4 text-emerald-700">{eur(p.recoveredValueEur, { compact: true })}</td>
                    <td className="py-2 text-emerald-700">{eur(p.savingPerHouseholdEur)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="card space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-navy-800">Growth pathway</p>
            <div className="flex flex-wrap gap-2">
              {PATHWAYS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPathway(p.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    pathway === p.key ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Slider label="Mining absorbs" value={absorbed} min={0} max={1} step={0.05} onChange={setAbsorbed} format={(v) => pct(v * 100, 0)} />
          <Slider label="Curtailment rise / GW" value={ddSlope} min={0} max={0.02} step={0.001} onChange={setDdSlope} format={(v) => pct(v * 100, 1)} />
          <Slider label="BTC price" value={btcPrice} min={20000} max={250000} step={1000} onChange={setBtcPrice} format={(v) => eur(v, { compact: true })} />
          <Slider label="Miner efficiency" value={efficiency} min={5} max={40} step={0.5} onChange={setEfficiency} format={(v) => `${v} J/TH`} />
          <Slider label="Households" value={households} min={1800000} max={2600000} step={50000} onChange={setHouseholds} format={(v) => num(v)} />
        </div>

        <Callout tone="info" title={`By ${summary.year}`}>
          <ul className="space-y-1">
            <li>Renewables: <strong>{num(summary.capacity, 0)} GW</strong></li>
            <li>Curtailment: <strong>{num(summary.curtailment / 1000, 1)} TWh/yr</strong></li>
            <li>Recovered value: <strong>{eur(summary.recoveredValue, { compact: true })}/yr</strong></li>
            <li>Saved per household: <strong>{eur(summary.savingPerHousehold)}/yr</strong></li>
          </ul>
        </Callout>
        <NotFinancialAdvice />
      </aside>
    </div>
  );
}
