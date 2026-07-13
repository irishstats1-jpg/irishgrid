import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getT } from '@/i18n/server';
import { HomeDashboard } from '@/components/HomeDashboard';
import { PeriodTable } from '@/components/PeriodTable';
import { Callout, Takeaway } from '@/components/ui';
import {
  ALL_PERIODS,
  computePeriodMetrics,
  getFuelMixSeries,
  type PeriodMetrics,
  refreshLiveData,
} from '@/lib/data/metrics';
import { computeReplacementCost, WHOLESALE_REF_EUR_PER_MWH } from '@/lib/methodology';
import { eur, energy } from '@/lib/format';
import type { PeriodKey } from '@/lib/methodology/types';

export const revalidate = 3600; // ISR: recompute hourly, aligned with the data cron (§9)

const TABLE_PERIODS: PeriodKey[] = ['yesterday', 'last_week', 'last_month', '2025', '2024', '2023', '2022'];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getT(locale);

  await refreshLiveData();
  const metricsByPeriod: Record<string, PeriodMetrics> = {};
  const seriesByPeriod: Record<string, Array<Record<string, number | string>>> = {};
  for (const p of ALL_PERIODS) {
    metricsByPeriod[p] = computePeriodMetrics(p);
    seriesByPeriod[p] = getFuelMixSeries(p) as Array<Record<string, number | string>>;
  }
  const tableMetrics: Record<string, PeriodMetrics> = {};
  for (const p of TABLE_PERIODS) tableMetrics[p] = metricsByPeriod[p] ?? computePeriodMetrics(p);

  const headline = metricsByPeriod['last_365'];
  const y = tableMetrics['2025'];
  const replacementCost = computeReplacementCost(y.wastedMwh, WHOLESALE_REF_EUR_PER_MWH);

  return (
    <>
      <section className="border-b border-navy-100 bg-gradient-to-b from-navy-50 to-white">
        <div className="container-page py-10 md:py-14">
          <p className="eyebrow mb-2">Step 1 · The problem</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-navy-900 md:text-5xl">
            {t('brand.tagline')}
          </h1>
          <p className="prose-body mt-4 max-w-3xl">
            Ireland is building world-class wind and solar. But on our windiest, brightest days the grid
            can&apos;t absorb it all — so we switch that clean power off and, in many cases,{' '}
            <strong>pay the generators anyway</strong>. Over the last year an estimated{' '}
            <strong>{formatGwh(headline.wastedMwh)}</strong> of clean electricity was thrown away, at a
            modelled cost of <strong>{formatEurCompact(headline.costEur)}</strong> — a bill that lands on
            your electricity account.
          </p>
          <p className="prose-body mt-3 max-w-3xl">
            Whether you care most about <strong>cutting household bills</strong>, hitting our{' '}
            <strong>climate targets</strong>, or simply <strong>not wasting money and clean energy</strong>,
            this is a problem worth fixing. Here&apos;s the scale of it, what it costs, and — across the next
            two steps — a practical, subsidy-free way to turn the waste into value.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/bitcoin" className="btn-primary">Next: the tool that can fix it</Link>
            <Link href="/proposal" className="btn-accent">Skip to the solution</Link>
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

      <section className="container-page py-10">
        <h2 className="mb-5 text-2xl font-bold text-navy-900">What &ldquo;curtailment&rdquo; actually is</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Curtailment vs constraint</h3>
            <p className="prose-body mt-2">
              Both are &ldquo;dispatch-down&rdquo; — the grid operator telling clean generators to produce
              less. <strong>Curtailment</strong> is system-wide: there is simply more renewable generation
              than the whole island can safely carry at once. <strong>Constraint</strong> is local: the
              wires in one area can&apos;t move the power to where it&apos;s needed.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Why it costs you money</h3>
            <p className="prose-body mt-2">
              Stability rules keep a floor of gas plants running, so wind is dialled back first. Many
              switched-off generators are <strong>paid compensation</strong>, and the lost clean output is
              replaced by <strong>burning gas</strong> — pushing up both wholesale prices and emissions. The
              cost flows straight through to consumers.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-2xl font-bold text-navy-900">What it costs billpayers</h2>
        <p className="prose-body mb-4 max-w-3xl">
          The headline cost is modelled as the compensation and constraint payments made to generators — not
          a naïve &ldquo;volume × price.&rdquo; We keep the wasted <em>volume</em> separate from the
          compensated <em>cost</em>, because curtailment is often unpaid for newer generators while
          constraint generally is. Full workings live on the{' '}
          <Link href="/about" className="font-medium text-sky-600 underline">Methodology page</Link>.
        </p>
        <div className="card">
          <PeriodTable metrics={tableMetrics} periods={TABLE_PERIODS} />
        </div>
        <div className="card mt-6 border-navy-200 bg-navy-50">
          <h3 className="font-semibold text-navy-900">Context: the replacement cost</h3>
          <p className="prose-body mt-2 max-w-3xl">
            Separately from the compensation figure, the clean energy lost to dispatch-down has to be
            replaced — usually by gas. Valued at a reference wholesale price of{' '}
            {eur(WHOLESALE_REF_EUR_PER_MWH)}/MWh, the {energy(y.wastedMwh)} wasted in 2025 represents roughly{' '}
            <strong>{eur(replacementCost, { compact: true })}</strong> of energy that had to come from
            elsewhere — plus the added emissions. This is context, not added to the headline cost.
          </p>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-2 text-2xl font-bold text-navy-900">And this only grows from here</h2>
        <p className="prose-body mb-6 max-w-3xl">
          Ireland&apos;s renewable capacity is set to roughly <strong>triple by 2040</strong> under published
          national targets. That is exactly what the climate transition needs — but without somewhere for the
          surplus to go, the share of clean energy we throw away climbs with it:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <p className="text-3xl font-bold text-navy-900">8.5%</p>
            <p className="mt-1 text-sm text-navy-600">of available wind turned away in 2022</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-600">10.7%</p>
            <p className="mt-1 text-sm text-navy-600">turned away in 2023</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-700">14.0%</p>
            <p className="mt-1 text-sm text-navy-600">turned away in 2024 — and rising</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-navy-400">
          Wind dispatch-down across the island of Ireland, from EirGrid&apos;s annual Constraint &amp;
          Curtailment reports. Republic-only volumes: 989 → 1,124 → 1,266 GWh.
        </p>
        <Callout tone="info" title="The uncomfortable maths">
          <p>
            New wires, storage and interconnectors will help — but they take a decade to build. Adding more
            wind onto today&apos;s grid means throwing away a <em>bigger</em> share of what we build, which
            quietly undermines the economics of the very projects we need. The question is what to do with
            the surplus <strong>in the meantime</strong> — and whether it can pay for itself.
          </p>
          <Takeaway>
            Everyone across the spectrum can agree on the goal: waste less, pay less, build more clean energy.
            The disagreement is only about how. The next step is a tool almost nobody expects.
          </Takeaway>
        </Callout>

        <div className="mt-8 rounded-2xl bg-navy-700 p-6 text-white md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Next in the story</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-navy-50">
              What could possibly soak up this surplus the instant it appears, switch off the moment your home
              needs it, run anywhere, and cost the taxpayer nothing? To answer that, you first need to
              understand one network.
            </p>
            <Link href="/bitcoin" className="btn-accent shrink-0">The Bitcoin network →</Link>
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
