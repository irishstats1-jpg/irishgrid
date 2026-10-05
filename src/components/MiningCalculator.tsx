'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  computeMiningEconomics,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_MINING_COSTS,
  FALLBACK_BTC_MARKET,
} from '@/lib/methodology';
import type { BtcMarket } from '@/lib/methodology/types';
import { eurModel, num, pct } from '@/lib/format';

// Net economics of a fleet that runs only on surplus power. Every input is an
// assumption the reader can change; nothing here is a forecast or advice.

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="flex justify-between gap-3 text-sm font-medium text-ink-800">
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
      {hint && <span className="block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

function Row({ k, v, strong = false }: { k: ReactNode; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 ${strong ? 'border-t border-white/30 font-semibold' : ''}`}>
      <dt className={strong ? '' : 'text-white/75'}>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

export function MiningCalculator({
  defaultGwh = 1000,
  market = FALLBACK_BTC_MARKET,
}: {
  defaultGwh?: number;
  market?: BtcMarket;
}) {
  const [energyGwh, setEnergyGwh] = useState(Math.round(defaultGwh));
  const [capture, setCapture] = useState(DEFAULT_ASSUMPTIONS.captureFactor);
  const [hours, setHours] = useState(DEFAULT_MINING_COSTS.surplusHoursPerYear);
  const [price, setPrice] = useState(Math.round(market.priceEur / 1000) * 1000);
  const [networkEh, setNetworkEh] = useState(Math.round(market.networkHashrateThs / 1e7) * 10);
  const [efficiency, setEfficiency] = useState(DEFAULT_ASSUMPTIONS.efficiencyJPerTh);
  const [hardware, setHardware] = useState(DEFAULT_MINING_COSTS.hardwareEurPerThs);
  const [network, setNetwork] = useState(DEFAULT_MINING_COSTS.networkChargesEurPerMwh);
  const [energyPayment, setEnergyPayment] = useState(DEFAULT_MINING_COSTS.energyPaymentEurPerMwh);

  const r = useMemo(
    () =>
      computeMiningEconomics(
        energyGwh * 1000,
        { ...DEFAULT_ASSUMPTIONS, captureFactor: capture, efficiencyJPerTh: efficiency },
        { ...market, priceEur: price, networkHashrateThs: networkEh * 1e6 },
        {
          ...DEFAULT_MINING_COSTS,
          surplusHoursPerYear: hours,
          hardwareEurPerThs: hardware,
          networkChargesEurPerMwh: network,
          energyPaymentEurPerMwh: energyPayment,
        },
      ),
    [energyGwh, capture, hours, price, networkEh, efficiency, hardware, network, energyPayment, market],
  );

  const positive = r.netEur >= 0;

  return (
    <div className="rounded-sm border border-ink-200 bg-white p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-2">The surplus</legend>
            <Field label="Surplus energy a year" value={energyGwh} min={100} max={6000} step={50} onChange={setEnergyGwh} format={(v) => `${num(v)} GWh`} />
            <Field label="Share the fleet captures" value={capture} min={0.5} max={1} step={0.01} onChange={setCapture} format={(v) => pct(v * 100, 0)} />
            <Field
              label="Hours a year with surplus"
              value={hours}
              min={500}
              max={8000}
              step={100}
              onChange={setHours}
              format={(v) => num(v)}
              hint="The fleet must be big enough for the surplus when it comes, so fewer hours means a bigger, more idle fleet."
            />
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-2">The market</legend>
            <Field label="BTC price" value={price} min={20000} max={250000} step={1000} onChange={setPrice} format={(v) => eurModel(v)} />
            <Field label="Network hashrate" value={networkEh} min={300} max={3000} step={10} onChange={setNetworkEh} format={(v) => `${num(v)} EH/s`} />
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-2">The costs</legend>
            <Field label="Miner efficiency" value={efficiency} min={10} max={35} step={0.5} onChange={setEfficiency} format={(v) => `${v} J/TH`} />
            <Field label="Hardware price" value={hardware} min={2} max={30} step={1} onChange={setHardware} format={(v) => `€${v}/TH/s`} hint={`Written off over ${DEFAULT_MINING_COSTS.hardwareLifeYears} years.`} />
            <Field label="Network charges" value={network} min={0} max={60} step={1} onChange={setNetwork} format={(v) => `€${v}/MWh`} hint="Zero if co-located behind the generator's meter." />
            <Field label="Payment to the generator" value={energyPayment} min={0} max={60} step={1} onChange={setEnergyPayment} format={(v) => `€${v}/MWh`} />
          </fieldset>
        </div>

        <div className="self-start rounded-sm bg-peat p-5 text-white">
          <p className="eyebrow !text-green-300">Net result, a year†</p>
          <p className={`figure mt-2 text-[52px] ${positive ? 'text-orange-400' : 'text-white'}`}>≈ {eurModel(r.netEur)}</p>
          <p className="mt-1 text-sm text-white/80">
            {positive ? 'Covers its costs under these assumptions.' : 'Does not cover its costs under these assumptions.'}{' '}
            Breaks even at ≈ {Number.isFinite(r.breakEvenPriceEur) ? eurModel(r.breakEvenPriceEur) : '—'} per BTC.
          </p>
          <dl className="mt-5 text-sm">
            <Row k="Fleet size" v={`≈ ${num(Math.round(r.fleetMw))} MW · runs ${pct(r.utilisationPct, 0)} of the year`} />
            <Row k="BTC earned (after pool fee)" v={`≈ ${num(r.revenue.btcNet, 0)} BTC`} />
            <Row k="Gross revenue" v={`≈ ${eurModel(r.revenue.revenueEur)}`} />
            <Row k="Hardware and site, a year" v={`≈ ${eurModel(r.annualisedCapexEur)}`} />
            <Row k="Operations" v={`≈ ${eurModel(r.operatingCostEur)}`} />
            <Row k="Network charges" v={`≈ ${eurModel(r.networkChargesEur)}`} />
            <Row k="Paid to generators" v={`≈ ${eurModel(r.energyPaymentsEur)}`} />
            <Row k="Net" v={`≈ ${eurModel(r.netEur)}`} strong />
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-white/70">
            † Modelled. Block subsidy only (fees excluded); network and price held constant for the year. Not financial
            advice.
          </p>
        </div>
      </div>
    </div>
  );
}
