'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FUEL_COLORS, FUEL_LABELS } from '@/lib/data/generators';
import type { FuelType } from '@/lib/methodology/types';

// Brand Book §04: green is the grid (waste, cost), orange is the Bitcoin
// counterpart — and only that. Fossil generation is grey (see FUEL_COLORS).
export const BRAND = { green: '#169B62', greenText: '#0D6440', orange: '#F7931A', orangeText: '#9C5306', rule: '#E6E7E8' } as const;

// Grouped for readability: coal/oil are folded into "other" upstream.
const RENEWABLE_ORDER: FuelType[] = ['wind', 'solar', 'hydro', 'imports', 'gas', 'other'];

/** Stacked area of fuel mix over time (MWh/day). */
export function FuelMixChart({ data }: { data: Array<Record<string, number | string>> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <Tooltip formatter={(v: number, n) => [`${Math.round(v).toLocaleString()} MWh`, FUEL_LABELS[n as FuelType] ?? n]} />
        <Legend formatter={(v) => FUEL_LABELS[v as FuelType] ?? v} wrapperStyle={{ fontSize: 12 }} />
        {RENEWABLE_ORDER.map((f) => (
          <Area key={f} type="monotone" dataKey={f} stackId="1" stroke={FUEL_COLORS[f]} fill={FUEL_COLORS[f]} fillOpacity={0.75} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Line/area of a single trend series. */
export function TrendChart({
  data,
  dataKey,
  color = BRAND.green,
  yFormat = (v) => Math.round(v).toLocaleString(),
  area = true,
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  color?: string;
  yFormat?: (v: number) => string;
  area?: boolean;
}) {
  const Comp = area ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <Comp data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => yFormat(Number(v))} width={48} />
        <Tooltip formatter={(v: number) => yFormat(v)} />
        {area ? (
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.25} />
        ) : (
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
        )}
      </Comp>
    </ResponsiveContainer>
  );
}

/** Small donut for the stats panel fuel mix. */
export function FuelMixDonut({ breakdown }: { breakdown: Record<FuelType, number> }) {
  const data = (Object.keys(breakdown) as FuelType[])
    .filter((f) => breakdown[f] > 0)
    .map((f) => ({ name: FUEL_LABELS[f], value: breakdown[f], fuel: f }));
  // The legend is rendered as normal-flow HTML below the chart rather than via
  // Recharts' absolutely-positioned <Legend>, which overflows its container when
  // it wraps to two rows and overlaps the stats beneath it.
  return (
    <div className="mt-1">
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={1}>
            {data.map((d) => (
              <Cell key={d.fuel} fill={FUEL_COLORS[d.fuel]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${Math.round(v).toLocaleString()} MWh`} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-ink-700">
        {data.map((d) => (
          <li key={d.fuel} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0"
              style={{ backgroundColor: FUEL_COLORS[d.fuel] }}
              aria-hidden
            />
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Two-series money view: what waste cost vs what it could have earned. */
export function MoneyChart({
  data,
}: {
  data: Array<{ date: string; cost: number; saved: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `€${Math.round(Number(v) / 1e6)}m`}
          width={52}
        />
        <Tooltip
          formatter={(v: number, n) => [
            `€${Math.round(v).toLocaleString()}`,
            n === 'cost' ? 'Paid out for wasted energy' : 'Value if the surplus had been mined†',
          ]}
        />
        <Legend
          formatter={(v) => (v === 'cost' ? 'Paid out for wasted energy' : 'Value if the surplus had been mined†')}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="cost" stroke={BRAND.green} fill={BRAND.green} fillOpacity={0.2} strokeWidth={2} />
        <Area type="monotone" dataKey="saved" stroke={BRAND.orange} fill={BRAND.orange} fillOpacity={0.25} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Side-by-side comparison bars (as-is cost vs BTC recovered value). */
export function ComparisonBars({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(Number(v) / 1e6).toFixed(0)}m`} width={52} />
        <Tooltip formatter={(v: number) => `€${Math.round(v).toLocaleString()}`} />
        <Bar dataKey="value">
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Forecast dual-line chart: curtailment curve + recovered/savings. */
export function ForecastChart({
  data,
}: {
  data: Array<{ year: number; curtailmentGwh: number; recoveredGwh: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)} TWh`} width={56} />
        <Tooltip formatter={(v: number, n) => [`${Math.round(v).toLocaleString()} GWh`, n === 'curtailmentGwh' ? 'Curtailment (business as usual)' : 'Recovered if mined†']} />
        <Legend formatter={(v) => (v === 'curtailmentGwh' ? 'Curtailment (business as usual)' : 'Recovered if mined†')} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="curtailmentGwh" stroke={BRAND.green} fill={BRAND.green} fillOpacity={0.3} />
        <Area type="monotone" dataKey="recoveredGwh" stroke={BRAND.orange} fill={BRAND.orange} fillOpacity={0.45} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Per-household savings line for the forecast page. */
export function SavingsChart({ data }: { data: Array<{ year: number; savingPerHouseholdEur: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#E6E7E8" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${Math.round(Number(v))}`} width={52} />
        <Tooltip formatter={(v: number) => `€${v.toFixed(2)} per household`} />
        <Line type="monotone" dataKey="savingPerHouseholdEur" stroke={BRAND.orange} dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
