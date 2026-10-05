import { MiningCalculator } from '@/components/MiningCalculator';
import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';

export const revalidate = 3600;

// Mining calculator widget. Embed:
// <iframe src="https://irishgrid.com/widget/calculator" width="720" height="900" style="border:0"></iframe>
export default async function CalculatorWidget() {
  await refreshLiveData();
  const y = getHeadlineYear();
  return (
    <div className="p-2">
      <MiningCalculator defaultGwh={y.windMwh / 1000} market={getBtcMarket()} />
      <p className="mt-2 text-[11px] text-ink-600">
        <a href="https://irishgrid.com/methodology" target="_blank" rel="noopener noreferrer" className="underline">
          Irish Grid
        </a>{' '}
        · independent, no connection to EirGrid or SONI · modelled, not financial advice
      </p>
    </div>
  );
}
