import { getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { eurModel, eurRange, gwh, pct } from '@/lib/format';

export const revalidate = 3600;

// Key-figures widget. Embed:
// <iframe src="https://irishgrid.com/widget/cost" width="360" height="260" style="border:0"></iframe>
export default async function CostWidget() {
  await refreshLiveData();
  const y = getHeadlineYear();
  return (
    <div className="rounded-sm bg-peat p-5 text-white" style={{ maxWidth: 360 }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-green-300">Irish Grid · Ireland · {y.year}</p>
      <p className="mt-2 text-3xl font-semibold">{gwh(y.windMwh)}</p>
      <p className="text-sm text-white/90">
        of wind power turned away
        {y.windPctOfAvailable !== null ? ` (${pct(y.windPctOfAvailable)} of available)` : ''} · reported by EirGrid
      </p>
      <p className="mt-3 text-2xl font-semibold text-green-300">≈ {eurModel(y.cost.central)}</p>
      <p className="text-sm text-white/90">
        compensation, modelled (range {eurRange(y.cost.low, y.cost.high)})
      </p>
      <a href="https://irishgrid.com/methodology" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-green-300 hover:underline">
        irishgrid.com · how these figures are made
      </a>
    </div>
  );
}
