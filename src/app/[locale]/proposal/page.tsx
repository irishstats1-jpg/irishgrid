import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice } from '@/components/ui';
import { DEFAULT_ASSUMPTIONS } from '@/lib/methodology';

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
  return (
    <>
      <PageHeader
        eyebrow="A proposal (clearly labelled)"
        title="Turn wasted clean energy into value — with flexible, interruptible mining load"
        intro={
          <>
            This section is an <strong>advocacy proposal</strong>, kept separate from the neutral data
            pages. The core idea is simple: put modular Bitcoin-mining units next to renewable sources so
            they consume <strong>only otherwise-curtailed output</strong>, switching off instantly when the
            grid needs the power.
          </>
        }
      />

      <Section title="The case">
        <p className="prose-body max-w-3xl">
          Ireland&apos;s renewable rollout is being held back by its own success: the more wind we build,
          the more we curtail, and curtailment undermines the economics of new projects. A flexible load
          that pays for otherwise-wasted energy improves those economics, reduces the net cost of the
          transition to billpayers, and helps stabilise the grid — all without competing with consumers.
        </p>
      </Section>

      <Section title="The headline proposal">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <p className="text-3xl font-bold text-sky-600">50 / 50</p>
            <p className="mt-1 font-semibold text-navy-900">Sell half, hold half</p>
            <p className="prose-body mt-2">
              Sell {Math.round(DEFAULT_ASSUMPTIONS.sellShareMonthly * 100)}% of mined BTC monthly to fund
              operations and return value / offset billpayer cost; hold the remaining
              {' '}{Math.round((1 - DEFAULT_ASSUMPTIONS.sellShareMonthly) * 100)}% for capital appreciation.
            </p>
          </div>
          <div className="card">
            <p className="text-3xl font-bold text-sky-600">⚡</p>
            <p className="mt-1 font-semibold text-navy-900">Interruptible by design</p>
            <p className="prose-body mt-2">
              Rapid, automatic switch-on/off tied to grid signals. The load drops within seconds when the
              grid needs power, so it never competes with homes or industry.
            </p>
          </div>
          <div className="card">
            <p className="text-3xl font-bold text-sky-600">📦</p>
            <p className="mt-1 font-semibold text-navy-900">Mobile & modular</p>
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
              <h3 className="font-semibold text-navy-900">{o.q}</h3>
              <p className="prose-body mt-2">{o.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6"><NotFinancialAdvice /></div>
      </Section>

      <Section>
        <div className="rounded-2xl bg-navy-700 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Want to help make this happen?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-navy-50">
            Whether you&apos;re a policymaker, an investor, a renewable operator with curtailment, or a
            supporter — there&apos;s a way to get involved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/get-involved" className="btn-accent">Get involved</Link>
            <Link href="/forecast" className="btn-outline !border-white !text-white hover:!bg-navy-600">See the 20-year outlook</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
