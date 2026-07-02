'use client';

import { useState } from 'react';
import type { PeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';
import { DEFAULT_ASSUMPTIONS } from '@/lib/methodology';
import { eur, energy } from '@/lib/format';
import { EstimateBadge, ActualBadge } from './ui';

const LABELS: Record<string, string> = {
  yesterday: 'Day',
  last_week: 'Week',
  last_month: 'Month',
  '2025': '2025',
  '2024': '2024',
  '2023': '2023',
  '2022': '2022',
  last_365: 'Last 365 days',
};

export function PeriodTable({
  metrics,
  periods,
}: {
  metrics: Record<string, PeriodMetrics>;
  periods: PeriodKey[];
}) {
  const [denom, setDenom] = useState<'household' | 'person'>('household');
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex rounded-md border border-navy-200 text-xs">
          {(['household', 'person'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDenom(d)}
              className={`px-3 py-1.5 font-medium ${denom === d ? 'bg-sky-500 text-white' : 'text-navy-700'}`}
            >
              per {d}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Cost of curtailment to billpayers by period</caption>
          <thead>
            <tr className="border-b border-navy-200 text-left text-navy-600">
              <th scope="col" className="py-2 pr-4 font-semibold">Period</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Wasted energy</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Payments (€)</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Cost / {denom}</th>
              <th scope="col" className="py-2 pr-4 font-semibold">If mined (€)</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Saved / {denom}</th>
              <th scope="col" className="py-2 font-semibold">Basis</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => {
              const m = metrics[p];
              if (!m) return null;
              const cost =
                denom === 'household' ? m.costEur / DEFAULT_ASSUMPTIONS.nHouseholds : m.costPerPersonEur;
              const save =
                denom === 'household' ? m.btcValueEur / DEFAULT_ASSUMPTIONS.nHouseholds : m.savingPerPersonEur;
              return (
                <tr key={p} className="border-b border-navy-100">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-navy-900">{LABELS[p] ?? p}</th>
                  <td className="py-2.5 pr-4 text-orange-700">{energy(m.wastedMwh)}</td>
                  <td className="py-2.5 pr-4">{eur(m.costEur, { compact: true })}</td>
                  <td className="py-2.5 pr-4">{eur(cost)}</td>
                  <td className="py-2.5 pr-4 text-emerald-700">{eur(m.btcValueEur, { compact: true })}</td>
                  <td className="py-2.5 pr-4 text-emerald-700">{eur(save)}</td>
                  <td className="py-2.5">{m.isEstimate ? <EstimateBadge label="est." /> : <ActualBadge label="actual" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
