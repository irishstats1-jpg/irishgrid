import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getT } from '@/i18n/server';
import { HomeDashboard } from '@/components/HomeDashboard';
import { PeriodTable } from '@/components/PeriodTable';
import { Callout, Framed, NotFinancialAdvice, PairedFigure, TagRow, Takeaway, WhyDiffer } from '@/components/ui';
import {
  ALL_PERIODS,
  computePeriodMetrics,
  getBtcMarket,
  getFuelMixSeries,
  type PeriodMetrics,
  refreshLiveData,
} from '@/lib/data/metrics';
import { computeReplacementCost, WHOLESALE_REF_EUR_PER_MWH } from '@/lib/methodology';
import { eur, energy, num } from '@/lib/format';
import { approx, asOfDate, btcFigure, btcTags, volumeTags } from '@/lib/basis';
import type { PeriodKey } from '@/lib/methodology/types';

export const revalidate = 3600; // ISR: recompute hourly, aligned with the data cron (§9)

const TABLE_PERIODS: PeriodKey[] = ['yesterday', 'last_week', 'last_month', '2025', '2024', '2023', '2022'];
/** The headline year the hero and the dashboard open on. */
const HEADLINE_PERIOD: PeriodKey = '2025';

const RISING = [
  { year: 2022, pct: '8.5%' },
  { year: 2023, pct: '10.7%' },
  { year: 2024, pct: '14.0%' },
];

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

  const y = metricsByPeriod[HEADLINE_PERIOD];
  const market = getBtcMarket();
  const asOf = asOfDate(y.computedAt);
  const replacementCost = computeReplacementCost(y.wastedMwh, WHOLESALE_REF_EUR_PER_MWH);
  const wastedShare = y.producedMwh > 0 ? (y.wastedMwh / (y.producedMwh + y.wastedMwh)) * 100 : 0;

  // "Waste less. Pay less. Build more clean energy." — the last line in green.
  const tagline = t('brand.tagline').split(/(?<=\.)\s+/);
  const taglineLead = tagline.slice(0, -1);
  const taglineGreen = tagline[tagline.length - 1];

  return (
    <>
      <section className="border-b border-ink-200">
        <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div>
            <p className="eyebrow mb-4 !text-green-700">Step 01 · An Fhadhb · The problem</p>
            <h1 className="display text-[52px] md:text-[84px]">
              {taglineLead.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-green-700">{taglineGreen}</span>
            </h1>
          </div>
          <div>
            <p className="prose-body">
              Ireland is building world-class wind and solar. But on the windiest, brightest days the grid can&apos;t
              take it all — so clean generators are told to dispatch down. Many are{' '}
              <strong>compensated anyway</strong>, and the lost power is usually <strong>replaced by gas</strong> — so
              billpayers cover both.
            </p>
            <p className="prose-body mt-3">
              Whether your priority is <strong>lower household bills</strong>, our <strong>climate targets</strong>,
              or simply <strong>not wasting money</strong>, this is worth fixing. Here is the scale of it — and, over
              the next two steps, a subsidy-free way to turn the waste into value.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/bitcoin" className="btn-accent">Next: the tool that can fix it →</Link>
              <Link href="/proposal" className="btn-outline">Skip to the solution</Link>
            </div>
          </div>
        </div>

        <div className="container-page pb-12">
          <PairedFigure
            size="lg"
            green={{
              label: 'Clean energy wasted',
              value: `${approx(y)}${energy(y.wastedMwh)}`,
              gloss: `≈ ${num(wastedShare, 1)}% of all electricity generated — dispatched down, often paid for, replaced by gas`,
              tags: [...volumeTags(y), { kind: 'scope', label: 'Republic only' }, { kind: 'scope', label: 'Wind + solar' }],
            }}
            orange={{
              label: 'If that surplus had mined Bitcoin',
              value: `≈ ${btcFigure(y.btcMinedNet)}`,
              gloss: `≈ ${eur(y.btcValueEur, { compact: true })} of recoverable value`,
              tags: btcTags(y),
            }}
          />
          <div className="mt-4">
            <NotFinancialAdvice priceEur={market.priceEur} asOf={asOf} />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <HomeDashboard
          metricsByPeriod={metricsByPeriod}
          seriesByPeriod={seriesByPeriod}
          periods={ALL_PERIODS as PeriodKey[]}
          headlinePeriod={HEADLINE_PERIOD}
          btcPriceEur={market.priceEur}
          asOf={asOf}
        />
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">Curtailment is not the same as constraint</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-[22px]">Two kinds of dispatch-down</h3>
            <p className="prose-body mt-2">
              Both mean the grid operator telling clean generators to produce less. <strong>Curtailment</strong> is
              system-wide: there is more renewable generation than the whole island can safely carry at once.{' '}
              <strong>Constraint</strong> is local: the wires in one area can&apos;t move the power to where it&apos;s
              needed.
            </p>
          </div>
          <div className="card">
            <h3 className="text-[22px]">Why billpayers cover it</h3>
            <p className="prose-body mt-2">
              Stability rules keep a floor of conventional plant running, so wind is dialled back first. Many
              dispatched-down generators are <strong>paid compensation</strong>, and the lost clean output is replaced
              by <strong>gas</strong> — adding to wholesale prices and emissions. The cost flows through to every bill.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">What it costs billpayers</h2>
        <p className="prose-body mb-4 max-w-3xl">
          Cost is modelled as the compensation and constraint payments made to generators — not a naïve &ldquo;volume
          × price.&rdquo; We keep the wasted <em>volume</em> separate from the compensated <em>cost</em>, because
          curtailment is often unpaid for newer generators while constraint generally is. Full workings are on the{' '}
          <Link href="/about" className="link">methodology page</Link>.
        </p>
        <div className="card">
          <PeriodTable metrics={tableMetrics} periods={TABLE_PERIODS} />
        </div>
        <div className="mt-6 border border-ink-200 p-5">
          <h3 className="text-[22px]">Context: the replacement cost</h3>
          <p className="prose-body mt-2 max-w-3xl">
            Separately from compensation, the clean energy lost to dispatch-down has to be replaced — usually by gas.
            At a reference wholesale price of {eur(WHOLESALE_REF_EUR_PER_MWH)}/MWh, the {approx(y)}
            {energy(y.wastedMwh)} wasted in 2025 represents ≈ <strong>{eur(replacementCost, { compact: true })}</strong>{' '}
            of energy that had to come from elsewhere, plus the added emissions. This is context, not added to the
            headline cost.
          </p>
          <TagRow
            className="mt-3"
            tags={[{ kind: 'period', label: 'Calendar 2025' }, { kind: 'method', label: 'Modelled' }]}
          />
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-2 text-[28px] leading-[1.1] md:text-[32px]">The grid can&apos;t take it all — and it&apos;s getting worse</h2>
        <p className="prose-body mb-6 max-w-3xl">
          Ireland&apos;s renewable capacity is set to roughly <strong>triple by 2040</strong> under published national
          targets. That is what the climate transition needs — but without somewhere for the surplus to go, the share
          of clean energy turned away climbs with it.
        </p>
        <Framed className="grid bg-white sm:grid-cols-3">
          {RISING.map((r, i) => (
            <div key={r.year} className={`p-5 md:p-6 ${i > 0 ? 'border-t border-ink-200 sm:border-l sm:border-t-0' : ''}`}>
              <p className="eyebrow flex items-center gap-2 !text-ink-800">
                <span className="inline-block h-3 w-3 bg-green-500" aria-hidden />
                Wind turned away · {r.year}
              </p>
              <p className="figure mt-3 text-[56px] text-green-700">{r.pct}</p>
            </div>
          ))}
        </Framed>
        <TagRow
          className="mt-3"
          tags={[
            { kind: 'period', label: 'Calendar 2022–2024' },
            { kind: 'scope', label: 'All-island' },
            { kind: 'scope', label: 'Wind only' },
            { kind: 'method', label: 'Reported · EirGrid C&C reports' },
          ]}
        />
        <WhyDiffer>
          These percentages cover the whole island and wind only. The figures above are the Republic only, wind and
          solar — in the Republic alone, wind turned away rose from 989 to 1,124 to 1,266 GWh over the same years.
        </WhyDiffer>

        <div className="mt-8">
          <Callout tone="info" title="The uncomfortable maths">
            <p>
              New wires, storage and interconnectors will help — but they take a decade to build. Adding more wind to
              today&apos;s grid means turning away a <em>bigger</em> share of what we build, which quietly undermines
              the economics of the very projects we need. The question is what to do with the surplus{' '}
              <strong>in the meantime</strong> — and whether it can pay for itself.
            </p>
            <Takeaway>
              Waste less. Pay less. Build more clean energy. Everyone can agree on the goal — the only question is
              how. The next step is a tool few people expect.
            </Takeaway>
          </Callout>
        </div>

        <div className="mt-8 bg-peat p-6 text-white md:p-8">
          <p className="eyebrow !text-green-300">Next in the story · Step 02</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-[17px] text-white/90">
              What could soak up this surplus the moment it appears, switch off the moment homes need the power, run
              anywhere, and cost the taxpayer nothing? To answer that, you first need to understand one network.
            </p>
            <Link href="/bitcoin" className="btn-accent shrink-0">The Bitcoin network →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
