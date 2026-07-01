'use client';

import { useMemo, useState } from 'react';
import { computeBtcSavings, DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from '@/lib/methodology';
import { eur, btc, energy, pct } from '@/lib/format';

// Interactive BTC-savings calculator (§7.4), also served as a widget (§14).
export function SavingsCalculator({ compact = false }: { compact?: boolean }) {
  const [wastedGwh, setWastedGwh] = useState(1000);
  const [efficiency, setEfficiency] = useState(DEFAULT_ASSUMPTIONS.efficiencyJPerTh);
  const [uptime, setUptime] = useState(DEFAULT_ASSUMPTIONS.uptimeFactor);
  const [btcPrice, setBtcPrice] = useState(FALLBACK_BTC_MARKET.priceEur);

  const r = useMemo(
    () =>
      computeBtcSavings(
        wastedGwh * 1000,
        8760,
        { ...DEFAULT_ASSUMPTIONS, efficiencyJPerTh: efficiency, uptimeFactor: uptime },
        { ...FALLBACK_BTC_MARKET, priceEur: btcPrice },
      ),
    [wastedGwh, efficiency, uptime, btcPrice],
  );

  const field = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    fmt: (v: number) => string,
  ) => (
    <label className="block">
      <span className="flex justify-between text-sm font-medium text-navy-800">
        <span>{label}</span>
        <span className="text-sky-600">{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-sky-500" />
    </label>
  );

  return (
    <div className={`rounded-xl border border-navy-100 bg-white p-5 ${compact ? '' : 'shadow-sm'}`}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          {field('Wasted energy / year', wastedGwh, 100, 6000, 50, setWastedGwh, (v) => energy(v * 1000))}
          {field('Miner efficiency', efficiency, 5, 40, 0.5, setEfficiency, (v) => `${v} J/TH`)}
          {field('Uptime factor', uptime, 0.5, 1, 0.01, setUptime, (v) => pct(v * 100, 0))}
          {field('BTC price', btcPrice, 20000, 250000, 1000, setBtcPrice, (v) => eur(v, { compact: true }))}
        </div>
        <div className="rounded-lg bg-navy-700 p-5 text-white">
          <p className="text-xs uppercase tracking-wide text-sky-400">Recoverable value</p>
          <p className="mt-1 text-3xl font-bold">{eur(r.valueEur, { compact: true })}</p>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-navy-100">BTC mined (net)</dt><dd>{btc(r.btcMinedNet)}</dd></div>
            <div className="flex justify-between"><dt className="text-navy-100">Network share</dt><dd>{pct(r.networkSharePct, 2)}</dd></div>
            <div className="flex justify-between"><dt className="text-navy-100">Saved / billpayer</dt><dd>{eur(r.savingPerBillpayerEur)}</dd></div>
          </dl>
          <p className="mt-4 text-[11px] text-navy-200">Illustrative · not financial advice</p>
        </div>
      </div>
    </div>
  );
}
