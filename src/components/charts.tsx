'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Brand Book v2.0: green is the grid (waste, cost), orange is the Bitcoin
// counterpart — and only that.
export const BRAND = {
  green: '#169B62',
  greenText: '#0B623D',
  greenLight: '#A8DCC1',
  orange: '#F7931A',
  orangeText: '#9A5200',
  ink: '#1D1F20',
  rule: '#E6E7E8',
} as const;

export interface YearBar {
  year: number;
  gwh: number;
  pct: number | null;
  provisional: boolean;
}

/** Annual wind dispatch-down, one bar per year; provisional years are pale. */
export function DispatchDownBars({
  data,
  selectedYear,
  onSelect,
}: {
  data: YearBar[];
  selectedYear?: number;
  onSelect?: (year: number) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={BRAND.rule} vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Number(v).toLocaleString('en-IE')}`} width={44} />
        <Tooltip
          cursor={{ fill: '#F2F2F3' }}
          formatter={(v: number, _n, item) => {
            const p = item?.payload as YearBar | undefined;
            const pct = p?.pct !== null && p?.pct !== undefined ? ` (${p.pct}% of available wind)` : '';
            return [`${Math.round(v).toLocaleString('en-IE')} GWh${pct}`, p?.provisional ? 'Provisional' : 'Reported'];
          }}
        />
        <Bar
          dataKey="gwh"
          onClick={(d: { year?: number }) => d?.year && onSelect?.(d.year)}
          style={onSelect ? { cursor: 'pointer' } : undefined}
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell
              key={d.year}
              fill={d.provisional ? BRAND.greenLight : BRAND.green}
              stroke={d.year === selectedYear ? BRAND.ink : d.provisional ? BRAND.green : 'none'}
              strokeWidth={d.year === selectedYear ? 2 : 1}
              strokeDasharray={d.provisional && d.year !== selectedYear ? '4 3' : undefined}
            />
          ))}
          <LabelList
            dataKey="gwh"
            position="top"
            formatter={(v: number) => Math.round(v).toLocaleString('en-IE')}
            style={{ fontSize: 12, fill: BRAND.ink }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Scenario chart: dispatch-down on a business-as-usual grid vs the share flexible demand uses. */
export function ForecastChart({
  data,
}: {
  data: Array<{ year: number; dispatchDownGwh: number; absorbedGwh: number }>;
}) {
  const label = (n: unknown) => (n === 'dispatchDownGwh' ? 'Dispatch-down (business as usual)' : 'Used by flexible demand');
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={BRAND.rule} vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)} TWh`} width={56} />
        <Tooltip formatter={(v: number, n) => [`${Math.round(v).toLocaleString('en-IE')} GWh`, label(n)]} />
        <Legend formatter={label} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="dispatchDownGwh" stroke={BRAND.green} fill={BRAND.green} fillOpacity={0.3} isAnimationActive={false} />
        <Area type="monotone" dataKey="absorbedGwh" stroke={BRAND.orange} fill={BRAND.orange} fillOpacity={0.4} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Gross mining revenue per scenario year (halving-aware), € — before any cost. */
export function RevenueChart({ data }: { data: Array<{ year: number; grossRevenueEur: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={BRAND.rule} vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${Math.round(Number(v) / 1e6)}M`} width={56} />
        <Tooltip formatter={(v: number) => [`€${Math.round(v / 1e6).toLocaleString('en-IE')}M`, 'Gross revenue, before costs†']} />
        <Line type="stepAfter" dataKey="grossRevenueEur" stroke={BRAND.orange} dot={false} strokeWidth={2.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
