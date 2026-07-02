'use client';

import { TrendChart } from './charts';

// Client wrapper for the BAU curtailment-growth chart on /curtailment —
// the y-axis formatter has to live client-side.
export function CurtailmentOutlookChart({
  data,
}: {
  data: Array<{ date: string; curtailment: number }>;
}) {
  return (
    <TrendChart
      data={data}
      dataKey="curtailment"
      color="#e06d3b"
      yFormat={(v) => `${(v / 1000).toFixed(1)} TWh`}
    />
  );
}
