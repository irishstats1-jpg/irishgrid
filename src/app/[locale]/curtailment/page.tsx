import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice, Takeaway } from '@/components/ui';
import { PeriodTable } from '@/components/PeriodTable';
import { ComparisonBars } from '@/components/charts';
import { computePeriodMetrics } from '@/lib/data/metrics';
import { eur, energy } from '@/lib/format';
import type { PeriodKey } from '@/lib/methodology/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Curtailment — the clean energy Ireland throws away',
  description:
    'What dispatch-down (curtailment and constraint) is, why it raises electricity costs and emissions, and how much it costs Irish billpayers — with a like-for-like comparison against recovering the value with flexible mining.',
};

const TABLE_PERIODS: PeriodKey[] = ['yesterday', 'last_week', 'last_month', '2024', '2023', '2022'];

export default function CurtailmentPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const metrics: Record<string, ReturnType<typeof computePeriodMetrics>> = {};
  for (const p of TABLE_PERIODS) metrics[p] = computePeriodMetrics(p);
  const y = metrics['2024'];

  const comparison = [
    { label: 'Paid to generators (as-is)', value: y.costEur, color: '#e06d3b' },
    { label: 'Value if surplus mined BTC', value: y.btcValueEur, color: '#2b9fd6' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="The problem"
        title="Ireland generates clean energy it cannot use"
        intro={
          <>
            When there is more wind than the grid can safely absorb, generators are{' '}
            <strong>dispatched down</strong> — told to produce less. That clean electricity is simply
            lost. In 2024 an estimated <strong>{energy(y.wastedMwh)}</strong> was dispatched down in the
            Republic, and the compensation attached to it costs billpayers money while gas is burned to
            fill the gap.
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
          to <strong>14.0% (2024)</strong>. Without matching grid, storage and flexible demand, adding more
          renewables means throwing away a bigger share of what we build — which undermines the economics of
          new projects. <Link href="/forecast" className="font-medium text-sky-600 underline">See the 20-year outlook →</Link>
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
              In 2024, the same wasted energy — if used by interruptible mining that switches off the instant
              the grid needs power — could have generated an estimated {eur(y.btcValueEur, { compact: true })}{' '}
              of recoverable value.
            </Takeaway>
          </div>
          <div className="space-y-4">
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
    </>
  );
}
