import { NextResponse } from 'next/server';
import { getBtcMarket, getHeadlineYear, getYear, refreshLiveData } from '@/lib/data/metrics';
import { INDEPENDENCE_LINE, METHOD_VERSION } from '@/lib/site';

// Figures for automated social posts (Make.com). ?year=2024; defaults to the
// latest reported year. Every value states its basis.
export const revalidate = 3600;

export async function GET(request: Request) {
  const yearParam = Number(new URL(request.url).searchParams.get('year'));
  await refreshLiveData();
  const m = (Number.isInteger(yearParam) && getYear(yearParam)) || getHeadlineYear();
  const market = getBtcMarket();

  return NextResponse.json({
    year: m.year,
    volume: {
      windDispatchDownGwh: Math.round(m.windMwh / 1000),
      windPctOfAvailable: m.windPctOfAvailable,
      method: m.method,
      source: m.sourceTitle,
      sourceUrl: m.sourceUrl,
    },
    costModelled: {
      lowEur: Math.round(m.cost.low),
      centralEur: Math.round(m.cost.central),
      highEur: Math.round(m.cost.high),
      perHouseholdCentralEur: Number(m.costPerHousehold.central.toFixed(2)),
    },
    miningModelled: {
      grossRevenueEur: Math.round(m.mining.revenue.revenueEur),
      netEur: Math.round(m.mining.netEur),
      btcNet: Number(m.mining.revenue.btcNet.toFixed(1)),
      breakEvenPriceEur: Number.isFinite(m.mining.breakEvenPriceEur) ? Math.round(m.mining.breakEvenPriceEur) : null,
      btcPriceEur: Math.round(market.priceEur),
      marketAsOf: market.asOf,
      marketLive: market.live,
    },
    cardUrl: `/api/social-card?year=${m.year}`,
    methodVersion: METHOD_VERSION,
    disclaimer: `Costs and Bitcoin figures are modelled (≈). Bitcoin figures are gross revenue before costs, not financial advice. ${INDEPENDENCE_LINE}`,
  });
}
