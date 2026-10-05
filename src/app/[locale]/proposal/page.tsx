import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice, PairedFigure } from '@/components/ui';
import { ForecastExplorer } from '@/components/ForecastExplorer';
import { DEFAULT_ASSUMPTIONS } from '@/lib/methodology';
import { computePeriodMetrics, getBtcMarket, refreshLiveData } from '@/lib/data/metrics';
import { asOfDate, btcTags, costTags } from '@/lib/basis';
import { eur } from '@/lib/format';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'The proposal — flexible Bitcoin mining as interruptible grid load',
  description:
    'A clearly-labelled proposal: site modular, interruptible Bitcoin-mining units next to renewables so they consume only otherwise-curtailed energy — improving renewable economics and lowering bills, with no new fossil demand. Objections answered.',
};

const OBJECTIONS = [
  {
    q: '“Bitcoin mining wastes energy.”',
    a: 'This proposal uses only energy that is already being wasted — clean electricity that has been generated and would otherwise be curtailed and thrown away. It adds no new demand on the system; it captures value from spillage.',
  },
  {
    q: '“It will raise emissions.”',
    a: 'The load runs on surplus renewable output, not gas. Because it is interruptible, it switches off the moment the grid needs power, so it never causes extra fossil generation. By improving renewable project economics it helps displace gas over time.',
  },
  {
    q: '“It competes with homes and industry.”',
    a: 'It cannot. The units are a buyer of last resort with rapid, automatic shut-off tied to grid signals: whenever the power is needed by consumers or the wholesale price rises, the miners stop within seconds. They only run when energy would otherwise be dumped.',
  },
  {
    q: '“Bitcoin’s price is volatile.”',
    a: 'True — which is why figures on this site are illustrative and never presented as guaranteed. The 50/50 sell-and-hold policy funds operations from monthly sales while retaining upside, and the core benefit (soaking up curtailment and improving renewable economics) holds even under conservative price assumptions.',
  },
];

export default async function ProposalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await refreshLiveData();
  const y = computePeriodMetrics('2025');
  const market = getBtcMarket();
  const n = DEFAULT_ASSUMPTIONS.nHouseholds;
  return (
    <>
      <PageHeader
        eyebrow="Step 03 · An Réiteach · The solution — a clearly-labelled proposal"
        step={3}
        title="Put the tool to work on the problem"
        intro={
          <>
            <strong>Step 1</strong> showed the problem: clean energy Ireland throws away and pays for.{' '}
            <strong>Step 2</strong> showed the tool: a flexible, interruptible, always-on energy buyer that
            can sit anywhere and needs no subsidy. The solution is simply to <strong>point one at the
            other</strong> — site modular Bitcoin-mining units next to renewables so they consume{' '}
            <strong>only otherwise-curtailed output</strong>, switching off the instant the grid needs the
            power. This section is a clearly-labelled <strong>advocacy proposal</strong>, kept separate from
            the neutral data pages.
          </>
        }
      />

      <Section title="The case — whatever your politics">
        <p className="prose-body max-w-3xl">
          Ireland&apos;s renewable rollout is being held back by its own success: the more wind we build,
          the more we curtail, and curtailment undermines the economics of new projects. A flexible load
          that pays for otherwise-wasted energy fixes that from every angle at once.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card">
            <h3 className="font-semibold text-ink">For households</h3>
            <p className="prose-body mt-2 text-sm">
              Revenue from rescued energy can offset the curtailment and constraint payments that currently
              sit on every bill — putting downward pressure on what you pay.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">For the climate</h3>
            <p className="prose-body mt-2 text-sm">
              Better project economics means more wind and solar actually get built, and none of this load
              runs on gas — so it never adds fossil demand. It helps the transition, not hinders it.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">For the taxpayer</h3>
            <p className="prose-body mt-2 text-sm">
              It is private capital, not public subsidy. It strengthens domestic energy independence and
              competes with no home or business for power — it only ever buys the surplus.
            </p>
          </div>
        </div>
      </Section>

      <Section title="The fix in one frame">
        <PairedFigure
          green={{
            label: 'Paid out for switched-off energy · per household',
            value: `≈ ${eur(y.costEur / n)}`,
            gloss: `≈ ${eur(y.costEur, { compact: true })} in compensation across Irish homes`,
            tags: costTags(y),
          }}
          orange={{
            label: 'Recoverable if that surplus were mined · per household',
            value: `≈ ${eur(y.btcValueEur / n)}`,
            gloss: `≈ ${eur(y.btcValueEur, { compact: true })} of value from energy already being thrown away`,
            tags: btcTags(y),
          }}
        />
        <div className="mt-4">
          <NotFinancialAdvice priceEur={market.priceEur} asOf={asOfDate(y.computedAt)} />
        </div>
      </Section>

      <Section title="The headline proposal">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <p className="figure text-[44px] text-orange-700">50 / 50</p>
            <p className="mt-2 font-display text-[20px] font-semibold text-ink">Sell half, hold half</p>
            <p className="prose-body mt-2">
              Sell {Math.round(DEFAULT_ASSUMPTIONS.sellShareMonthly * 100)}% of mined BTC monthly to fund
              operations and return value / offset billpayer cost; hold the remaining
              {' '}{Math.round((1 - DEFAULT_ASSUMPTIONS.sellShareMonthly) * 100)}% for capital appreciation.
            </p>
          </div>
          <div className="card">
            <FeatureIcon d="M12 3v8 M6.3 6.3a8 8 0 1 0 11.4 0" />
            <p className="mt-2 font-display text-[20px] font-semibold text-ink">Interruptible by design</p>
            <p className="prose-body mt-2">
              Rapid, automatic switch-on/off tied to grid signals. The load drops within seconds when the
              grid needs power, so it never competes with homes or industry.
            </p>
          </div>
          <div className="card">
            <FeatureIcon d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16Z M3.5 8 12 12.5 20.5 8 M12 12.5v8" />
            <p className="mt-2 font-display text-[20px] font-semibold text-ink">Mobile & modular</p>
            <p className="prose-body mt-2">
              Container-scale units sited close to energy sources, deployable where curtailment is highest
              and relocatable as the grid evolves.
            </p>
          </div>
        </div>
      </Section>

      <Section title="How it works">
        <ol className="prose-body max-w-3xl list-decimal space-y-3 pl-5">
          <li>Modular mining units are sited next to wind/solar generation with high curtailment.</li>
          <li>They mine <strong>only when energy is not otherwise in demand</strong> — i.e. during curtailment/constraint events when output would be dumped.</li>
          <li>Grid signals trigger <strong>rapid, interruptible</strong> shut-off: when the system needs the power, the load drops instantly and the electricity flows to consumers.</li>
          <li>Revenue is split 50/50 — sold to offset costs and held for the long term.</li>
        </ol>
      </Section>

      <Section title="Objections, answered">
        <Callout tone="proposal" title="The one thing to remember">
          This proposal consumes <strong>only otherwise-curtailed renewable output</strong> — energy already
          generated and thrown away. It behaves as an interruptible buyer of last resort that switches off the
          instant the grid needs the power, so it adds <strong>no new fossil-fuelled demand</strong>. It
          improves the economics of renewables and lowers billpayer costs.
        </Callout>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div key={o.q} className="card">
              <h3 className="font-semibold text-ink">{o.q}</h3>
              <p className="prose-body mt-2">{o.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6"><NotFinancialAdvice priceEur={market.priceEur} asOf={asOfDate(y.computedAt)} /></div>
      </Section>

      {/* Merged from the 20-year outlook: what the solution is worth over time */}
      <Section title="Looking ahead: what this is worth over 20 years">
        <p className="prose-body mb-3 max-w-3xl">
          These are <strong>scenarios, not predictions</strong> — anchored on Ireland&apos;s published
          capacity targets and the 2022–2024 dispatch-down trend. Move the sliders and watch the waste
          curve, the recovered value, and the savings per household recompute live.
        </p>
        <Callout tone="warn" title="Read this first">
          Long-range grid fixes — new transmission, storage, the Celtic Interconnector, a higher SNSP limit —
          could reduce curtailment on their own, and Bitcoin&apos;s value is volatile. Treat every figure
          below as an illustrative scenario output, with conservative defaults.
        </Callout>
        <div className="mt-6">
          <ForecastExplorer />
        </div>
      </Section>

      <Section>
        <div className="rounded-sm bg-peat p-8 text-center text-white">
          <h2 className="text-2xl font-semibold">Want to help make this happen?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-white/90">
            Whether you&apos;re a policymaker, an investor, a renewable operator with curtailment, or a
            supporter — there&apos;s a way to get involved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/get-involved" className="btn-primary !bg-white !text-peat hover:!bg-green-100">Get involved</Link>
            <Link href="/pledge" className="btn-outline !border-white !text-white hover:!bg-peat-light">Sign the pledge</Link>
          </div>
        </div>
      </Section>
    </>
  );
}

function FeatureIcon({ d }: { d: string }) {
  return (
    <svg className="h-10 w-10 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
