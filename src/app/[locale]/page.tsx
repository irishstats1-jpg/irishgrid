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
          <p className="eyebrow mb-2">Step 1 · The problem</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-navy-900 md:text-5xl">
            {t('brand.tagline')}
          </h1>
          <p className="prose-body mt-4 max-w-3xl">
            Ireland is building world-class wind and solar — but when the grid can&apos;t absorb it, that
            clean electricity is simply switched off, and billpayers cover the cost. Over the last year an
            estimated <strong>{formatGwh(headline.wastedMwh)}</strong> of clean energy was thrown away, at a
            modelled cost of <strong>{formatEurCompact(headline.costEur)}</strong>. This site shows the
            problem, what it costs you, and a practical way to fix it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/curtailment" className="btn-primary">Where the money goes</Link>
            <Link href="/proposal" className="btn-accent">The solution</Link>
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

      {/* Forward look (merged from the forecast): the problem grows with success */}
      <section className="container-page py-10">
        <h2 className="mb-2 text-2xl font-bold text-navy-900">And this is only the beginning</h2>
        <p className="prose-body mb-6 max-w-3xl">
          Ireland&apos;s renewable capacity is set to roughly <strong>triple by 2040</strong> under
          published national targets. That&apos;s great news — but without somewhere for the surplus to go,
          the share of clean energy we throw away keeps climbing too:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <p className="text-3xl font-bold text-navy-900">8.5%</p>
            <p className="mt-1 text-sm text-navy-600">of available wind wasted in 2022</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-600">10.7%</p>
            <p className="mt-1 text-sm text-navy-600">wasted in 2023</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-700">14.0%</p>
            <p className="mt-1 text-sm text-navy-600">wasted in 2024 — and rising</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-navy-700 p-6 text-white md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Next in the story</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-navy-50">
              Who pays for all this switched-off energy? You do — through curtailment and constraint
              payments that land on every electricity bill.
            </p>
            <Link href="/curtailment" className="btn-accent shrink-0">Curtailment payments →</Link>
          </div>
        </div>
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
