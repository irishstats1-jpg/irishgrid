'use client';

import { useState } from 'react';
import type { PeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';
import { DEFAULT_ASSUMPTIONS } from '@/lib/methodology';
import { eur, energy } from '@/lib/format';
import { approx, PERIOD_TAG } from '@/lib/basis';
import { BasisTag } from './ui';

const METHOD_LABEL = { reported: 'Reported', provisional: 'Provisional', modelled: 'Modelled' } as const;

export function PeriodTable({
  metrics,
  periods,
}: {
  metrics: Record<string, PeriodMetrics>;
  periods: PeriodKey[];
}) {
  const [denom, setDenom] = useState<'household' | 'person'>('household');
  const n = denom === 'household' ? DEFAULT_ASSUMPTIONS.nHouseholds : DEFAULT_ASSUMPTIONS.nPeople;
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex rounded-sm border border-ink-200 font-display text-[14px]" role="group" aria-label="Per">
          {(['household', 'person'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDenom(d)}
              aria-pressed={denom === d}
              className={`min-h-[32px] px-3 py-1 font-semibold ${denom === d ? 'bg-green-700 text-white' : 'text-ink-700'}`}
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
            <tr className="border-b border-ink-700 text-left">
              <th scope="col" className="py-2 pr-4 font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">Period</th>
              <th scope="col" className="py-2 pr-4 text-right font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">Wasted</th>
              <th scope="col" className="py-2 pr-4 text-right font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">Paid out</th>
              <th scope="col" className="py-2 pr-4 text-right font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">Per {denom}</th>
              <th scope="col" className="py-2 pr-4 text-right font-display text-[13px] font-medium uppercase tracking-[0.08em] text-orange-700">If mined†</th>
              <th scope="col" className="py-2 pr-4 text-right font-display text-[13px] font-medium uppercase tracking-[0.08em] text-orange-700">Per {denom}†</th>
              <th scope="col" className="py-2 font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">Volume basis</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => {
              const m = metrics[p];
              if (!m) return null;
              return (
                <tr key={p} className="border-b border-ink-200">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{PERIOD_TAG[p] ?? p}</th>
                  <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-green-700">{approx(m)}{energy(m.wastedMwh)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">≈ {eur(m.costEur, { compact: true })}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">≈ {eur(m.costEur / n)}</td>
                  <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-orange-700">≈ {eur(m.btcValueEur, { compact: true })}</td>
                  <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-orange-700">≈ {eur(m.btcValueEur / n)}</td>
                  <td className="py-2.5">
                    <BasisTag kind="method">{METHOD_LABEL[m.method]}</BasisTag>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-600">
        Volumes for 2022–2024 are reported in EirGrid&apos;s Constraint &amp; Curtailment reports; 2025 is provisional
        until its report is published; shorter periods are modelled. All € figures are modelled (≈).
      </p>
    </div>
  );
}
