import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getT } from '@/i18n/server';
import { HomeDashboard } from '@/components/HomeDashboard';
import { ALL_PERIODS, computePeriodMetrics, getFuelMixSeries, type PeriodMetrics } from '@/lib/data/metrics';
import type { PeriodKey } from '@/lib/methodology/types';

export const revalidate = 3600; // ISR: recompute hourly, aligned with the data cron (§9)

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getT(locale);

  const metricsByPeriod: Record<string, PeriodMetrics> = {};
  const seriesByPeriod: Record<string, Array<Record<string, number | string>>> = {};
  for (const p of ALL_PERIODS) {
    metricsByPeriod[p] = computePeriodMetrics(p);
    seriesByPeriod[p] = getFuelMixSeries(p) as Array<Record<string, number | string>>;
  }

  const headline = metricsByPeriod['last_365'];

  return (
    <>
      <section className="border-b border-navy-100 bg-gradient-to-b from-navy-50 to-white">
        <div className="container-page py-10 md:py-14">
          <p className="eyebrow mb-2">Sources &amp; Cost</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-navy-900 md:text-5xl">
            {t('brand.tagline')}
          </h1>
          <p className="prose-body mt-4 max-w-3xl">
            Ireland generates more and more clean electricity — and throws a growing share of it away
            because the grid can&apos;t always use it. Over the last year an estimated{' '}
            <strong>{formatGwh(headline.wastedMwh)}</strong> of clean energy was dispatched down, at a
            modelled cost of <strong>{formatEurCompact(headline.costEur)}</strong> to billpayers. Explore
            the live picture below.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/curtailment" className="btn-primary">See what it costs</Link>
            <Link href="/proposal" className="btn-accent">The proposal</Link>
            <Link href="/about" className="btn-outline">Methodology</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <HomeDashboard
          metricsByPeriod={metricsByPeriod}
          seriesByPeriod={seriesByPeriod}
          periods={ALL_PERIODS as PeriodKey[]}
        />
      </section>
    </>
  );
}

function formatGwh(mwh: number): string {
  return `${Math.round(mwh / 1000).toLocaleString('en-IE')} GWh`;
}
function formatEurCompact(v: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);
}
