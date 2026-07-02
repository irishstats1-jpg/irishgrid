import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice, Takeaway } from '@/components/ui';
import { PeriodTable } from '@/components/PeriodTable';
import { ComparisonBars } from '@/components/charts';
import { CurtailmentOutlookChart } from '@/components/CurtailmentOutlookChart';
import { computePeriodMetrics } from '@/lib/data/metrics';
import {
  computeForecast,
  computeReplacementCost,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_FORECAST_CONFIG,
  FALLBACK_BTC_MARKET,
  WHOLESALE_REF_EUR_PER_MWH,
} from '@/lib/methodology';
import { eur, energy, num } from '@/lib/format';
import type { PeriodKey } from '@/lib/methodology/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Curtailment payments — Ireland pays to throw clean energy away',
  description:
    'What dispatch-down (curtailment and constraint) is, why billpayers end up paying for switched-off clean energy, how much it costs — and how fast it grows if nothing changes.',
};

const TABLE_PERIODS: PeriodKey[] = ['yesterday', 'last_week', 'last_month', '2025', '2024', '2023', '2022'];

export default async function CurtailmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const metrics: Record<string, ReturnType<typeof computePeriodMetrics>> = {};
  for (const p of TABLE_PERIODS) metrics[p] = computePeriodMetrics(p);
  const y = metrics['2025'];

  const comparison = [
    { label: 'Paid to generators (as-is)', value: y.costEur, color: '#e06d3b' },
    { label: 'Value if surplus mined BTC', value: y.btcValueEur, color: '#2b9fd6' },
  ];
  const replacementCost = computeReplacementCost(y.wastedMwh, WHOLESALE_REF_EUR_PER_MWH);

  // Merged from the 20-year outlook: business-as-usual curtailment growth.
  const bau = computeForecast('bau', DEFAULT_FORECAST_CONFIG, DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET);
  const bauSeries = bau.map((p) => ({ date: String(p.year), curtailment: Math.round(p.curtailmentGwh) }));
  const bauEnd = bau[bau.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Step 2 · The cost"
        title="Ireland pays to throw clean energy away"
        intro={
          <>
            When there is more wind than the grid can safely absorb, generators are{' '}
            <strong>dispatched down</strong> — told to produce less. The clean electricity is lost, many
            generators are <strong>paid compensation</strong> for it, and gas is burned to fill the gap.
            In 2025 alone an estimated <strong>{energy(y.wastedMwh)}</strong> was thrown away. That bill
            lands on you.
          </>
        }
      />

      <Section title="What curtailment actually is">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Curtailment vs constraint</h3>
            <p className="prose-body mt-2">
              Both are &ldquo;dispatch-down.&rdquo; <strong>Curtailment</strong> is system-wide: there is
              simply too much renewable generation for the whole island to use safely at once (the SNSP
              limit caps how much non-synchronous generation the grid can carry). <strong>Constraint</strong>{' '}
              is local: the wires in a particular area can&apos;t carry the power to where it&apos;s needed.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Why it costs money</h3>
            <p className="prose-body mt-2">
              Minimum-generation rules keep a floor of conventional (gas) plants running for stability, so
              wind is dialled back first. Some dispatched-down generators are paid compensation, and the
              lost clean output has to be replaced by burning gas — pushing wholesale prices and emissions
              up. The bill lands on consumers.
            </p>
          </div>
        </div>
        <Callout tone="info" title="It gets worse as we build more wind">
          Wind dispatch-down rose from about <strong>8.5% (2022)</strong> to <strong>10.7% (2023)</strong>{' '}
          to <strong>14.0% (2024)</strong> — and an estimated <strong>15.5% (2025, provisional)</strong>.
          Without matching grid, storage and flexible demand, adding more
          renewables means throwing away a bigger share of what we build — which undermines the economics of
          new projects.
        </Callout>
      </Section>

      <Section title="What it costs billpayers">
        <p className="prose-body mb-4 max-w-3xl">
          Headline cost is modelled as the compensation / constraint payments made to generators — not a
          naïve &ldquo;volume × price.&rdquo; Curtailment is often uncompensated for newer generators, while
          constraint is generally paid, so we separate the wasted <em>volume</em> from the compensated{' '}
          <em>cost</em>. Full workings are on the{' '}
          <Link href="/about" className="font-medium text-sky-600 underline">Methodology page</Link>.
        </p>
        <div className="card">
          <PeriodTable metrics={metrics} periods={TABLE_PERIODS} />
        </div>
      </Section>

      <Section title="As-is vs recovering the value">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <ComparisonBars data={comparison} />
            <Takeaway>
              In 2025, the same wasted energy — if used by interruptible mining that switches off the instant
              the grid needs power — could have generated an estimated {eur(y.btcValueEur, { compact: true })}{' '}
              of recoverable value.
            </Takeaway>
          </div>
          <div className="space-y-4">
            <div className="card border-navy-200 bg-navy-50">
              <h3 className="font-semibold text-navy-900">Supporting context: replacement cost</h3>
              <p className="prose-body mt-2">
                Separately from the compensation figure, the clean energy lost to dispatch-down has to be
                replaced — usually by burning gas. Valued at a reference wholesale price of{' '}
                {eur(WHOLESALE_REF_EUR_PER_MWH)}/MWh, the {energy(y.wastedMwh)} wasted in 2025 represents
                roughly <strong>{eur(replacementCost, { compact: true })}</strong> of energy that had to come
                from elsewhere — plus the added emissions. This is context, not added to the headline cost.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-navy-900">How mining makes more renewables feasible</h3>
              <p className="prose-body mt-2">
                A flexible &ldquo;buyer of last resort&rdquo; that only runs on otherwise-curtailed output
                gives wind and solar projects revenue for energy they&apos;d otherwise waste — improving
                project economics and helping more renewables get built, without adding new fossil demand.
              </p>
              <Link href="/proposal" className="btn-accent mt-4">Read the proposal</Link>
            </div>
            <NotFinancialAdvice />
          </div>
        </div>
      </Section>

      {/* Merged from the 20-year outlook: where this heads if nothing changes */}
      <Section title="If nothing changes, the bill keeps growing">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Projected energy thrown away per year</h3>
            <CurtailmentOutlookChart data={bauSeries} />
            <Takeaway>
              A scenario, not a prediction — anchored on Ireland&apos;s published capacity targets and the
              2022–2024 dispatch-down trend, with a business-as-usual grid.
            </Takeaway>
          </div>
          <div className="space-y-4">
            <p className="prose-body">
              Ireland&apos;s renewable capacity is set to roughly triple by 2040. That&apos;s exactly what the
              climate targets require — but on a business-as-usual grid, the waste grows with it. By{' '}
              {bauEnd.year}, this scenario reaches about{' '}
              <strong>{num(bauEnd.curtailmentGwh / 1000, 1)} TWh</strong> of clean electricity thrown away{' '}
              <em>every year</em> — several times today&apos;s level, with the payments to match.
            </p>
            <p className="prose-body">
              New wires, storage and interconnectors will help, but they take a decade to build. The question
              is what to do with the surplus <em>in the meantime</em> — and whether it can pay for itself.
            </p>
            <Callout tone="info" title="Assumptions are adjustable">
              The full interactive version of this projection — with sliders for growth pace, curtailment
              rate and value assumptions — lives on the Proposal page.
            </Callout>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl bg-navy-700 p-6 text-white md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Next in the story</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-navy-50">
              There&apos;s a way to turn this growing waste into value — flexible demand that buys only the
              energy we&apos;d otherwise throw away, and switches off the instant the grid needs it.
            </p>
            <Link href="/proposal" className="btn-accent shrink-0">The proposal →</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
