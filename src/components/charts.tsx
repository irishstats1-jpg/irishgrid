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

// Grouped for readability: coal/oil are folded into "other" upstream.
const RENEWABLE_ORDER: FuelType[] = ['wind', 'solar', 'hydro', 'imports', 'gas', 'other'];

/** Stacked area of fuel mix over time (MWh/day). */
export function FuelMixChart({ data }: { data: Array<Record<string, number | string>> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
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
  color = '#2b9fd6',
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
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
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={1}>
          {data.map((d) => (
            <Cell key={d.fuel} fill={FUEL_COLORS[d.fuel]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `${Math.round(v).toLocaleString()} MWh`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `€${Math.round(Number(v) / 1e6)}m`}
          width={52}
        />
        <Tooltip
          formatter={(v: number, n) => [
            `€${Math.round(v).toLocaleString()}`,
            n === 'cost' ? 'Paid out for wasted energy' : 'Value mining could have recovered',
          ]}
        />
        <Legend
          formatter={(v) => (v === 'cost' ? 'Paid out for wasted energy' : 'Value mining could have recovered')}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="cost" stroke="#c2410c" fill="#c2410c" fillOpacity={0.2} strokeWidth={2} />
        <Area type="monotone" dataKey="saved" stroke="#059669" fill="#059669" fillOpacity={0.25} strokeWidth={2} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(Number(v) / 1e6).toFixed(0)}m`} width={52} />
        <Tooltip formatter={(v: number) => `€${Math.round(v).toLocaleString()}`} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)} TWh`} width={56} />
        <Tooltip formatter={(v: number, n) => [`${Math.round(v).toLocaleString()} GWh`, n === 'curtailmentGwh' ? 'Curtailment (BAU)' : 'Recovered by mining']} />
        <Legend formatter={(v) => (v === 'curtailmentGwh' ? 'Curtailment (BAU)' : 'Recovered by mining')} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="curtailmentGwh" stroke="#e06d3b" fill="#e06d3b" fillOpacity={0.3} />
        <Area type="monotone" dataKey="recoveredGwh" stroke="#2b9fd6" fill="#2b9fd6" fillOpacity={0.4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Per-household savings line for the forecast page. */
export function SavingsChart({ data }: { data: Array<{ year: number; savingPerHouseholdEur: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${Math.round(Number(v))}`} width={52} />
        <Tooltip formatter={(v: number) => `€${v.toFixed(2)} per household`} />
        <Line type="monotone" dataKey="savingPerHouseholdEur" stroke="#17a2a2" dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
