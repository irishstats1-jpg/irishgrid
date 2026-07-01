import { computePeriodMetrics } from '@/lib/data/metrics';
import { eur, energy } from '@/lib/format';

export const revalidate = 3600;

// "Live wasted-energy cost" counter widget (§14). Embed:
// <iframe src="https://irishgrid.com/widget/cost" width="360" height="200" style="border:0"></iframe>
export default function CostWidget() {
  const m = computePeriodMetrics('last_365');
  return (
    <div className="rounded-xl bg-navy-700 p-5 text-white" style={{ maxWidth: 360 }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Irish Grid · last 365 days</p>
      <p className="mt-2 text-3xl font-bold">{energy(m.wastedMwh)}</p>
      <p className="text-sm text-navy-50">clean energy wasted</p>
      <p className="mt-3 text-2xl font-bold text-orange-300">{eur(m.costEur, { compact: true })}</p>
      <p className="text-sm text-navy-50">cost to billpayers</p>
      <a href="https://irishgrid.com" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-sky-400 hover:underline">
        irishgrid.com — modelled · not financial advice
      </a>
    </div>
  );
}
