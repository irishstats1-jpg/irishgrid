import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice, PairedFigure } from '@/components/ui';
import { ForecastExplorer } from '@/components/ForecastExplorer';
import { MiningCalculator } from '@/components/MiningCalculator';
import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { DEFAULT_MINING_COSTS } from '@/lib/methodology';
import { asOfDate, btcFigure, btcTags, costTags } from '@/lib/basis';
import { eurModel, eurRange, gwh, num, pct } from '@/lib/format';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'The policy option — using Ireland’s surplus wind',
  description:
    'Three policy options to let flexible, interruptible demand use wind power Ireland currently turns away — with the costs, the break-even price, and how flexible mining compares with the alternatives.',
};

const OPTIONS = [
  {
    id: 'A',
    t: 'Publish dispatch-down data by node and hour',
    b: 'EirGrid publishes annual totals. Hourly figures by grid location would show investors — of any flexible load, from batteries to electrolysers to mining — where and when the surplus occurs, and let the public check the cost.',
  },
  {
    id: 'B',
    t: 'Define interruptible flexible demand in connection policy',
    b: 'Create a connection category for demand that agrees to run only when the system has surplus and to stop on instruction, with faster, cheaper connections in return. Loads that cannot meet the terms do not qualify.',
  },
  {
    id: 'C',
    t: 'Pilot co-location at a constrained renewable site',
    b: 'A time-limited pilot behind the meter at a wind farm with high constraint, privately funded, with published data on hours run, energy used, response times and the effect on compensation.',
  },
];

const ALTERNATIVES = [
  {
    name: 'Grid reinforcement',
    does: 'Removes constraints at the source',
    time: 'Years to a decade',
    pays: 'Billpayers, through network tariffs',
    limits: 'Slow to plan and build; does not remove system-wide curtailment',
  },
  {
    name: 'Batteries',
    does: 'Shifts surplus by a few hours',
    time: '1–2 years',
    pays: 'Developers, recovered through markets and capacity payments',
    limits: 'Hours, not days — long windy spells overwhelm them',
  },
  {
    name: 'Interconnectors',
    does: 'Exports surplus to Britain and France',
    time: 'Years',
    pays: 'Billpayers and developers',
    limits: 'Neighbouring grids are often windy at the same time',
  },
  {
    name: 'Electrolysers (hydrogen)',
    does: 'Turns surplus into hydrogen',
    time: 'Years; early stage in Ireland',
    pays: 'Developers, often with public support',
    limits: 'Low round-trip efficiency; needs hydrogen users and storage',
  },
  {
    name: 'Heat and demand response',
    does: 'Moves existing demand into windy hours',
    time: 'Months to years',
    pays: 'Customers and suppliers',
    limits: 'Limited by how much demand can move',
  },
  {
    name: 'Flexible mining',
    does: 'Adds demand that runs only on surplus',
    time: 'Months',
    pays: 'Private investors',
    limits: 'Volatile revenue; hardware waste; noise; needs connection rules',
  },
];

const OBJECTIONS = [
  {
    q: '“Bitcoin mining wastes energy.”',
    a: 'The option here uses only power that is already being turned away. If the rules allow it to run at any other time, it would add demand like any other load — which is why option B makes interruptibility a condition of connection.',
  },
  {
    q: '“It will raise emissions.”',
    a: 'Not if it runs only on surplus wind and stops when the system needs the power: at those moments the extra demand is met by wind that would otherwise be turned down. Enforcement is the point of options B and C.',
  },
  {
    q: '“It will compete with homes and industry.”',
    a: 'A load that must stop on instruction cannot take power others need. The test is whether the instruction is followed, quickly and every time — something a pilot can measure.',
  },
  {
    q: '“It doesn’t make money.”',
    a: 'At today’s price, under our central assumptions, a fleet that runs only on surplus does not cover its costs (see above). That is for investors to judge; the policy options cost the public nothing either way.',
  },
];

export default async function ProposalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await refreshLiveData();
  const y = getHeadlineYear();
  const market = getBtcMarket();
  const asOf = asOfDate(market.asOf);
  const e = y.mining;

  return (
    <>
      <PageHeader
        eyebrow="03 · An Réiteach — The policy option"
        step={3}
        title="Let flexible demand use the surplus"
        intro={
          <>
            Step 01 showed the power Ireland turns away and what it is likely to cost. Step 02 showed one load that can
            take power when it is spare and stop in seconds. This page sets out what that load would earn and cost,
            how it compares with the alternatives, and three policy options that would help any flexible load use the
            surplus. It is advocacy, kept separate from the evidence on the other pages.
          </>
        }
      />

      <Section title="Why it matters, whatever your priority">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <h3 className="font-semibold text-ink">Bills</h3>
            <p className="prose-body mt-2 text-sm">
              Every megawatt-hour used instead of turned away is one that may not need compensating — and those
              payments reach every bill.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">Climate</h3>
            <p className="prose-body mt-2 text-sm">
              Wind farms that can sell power they now lose are easier to finance, which helps the build-out the 2030
              targets depend on.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">Public money</h3>
            <p className="prose-body mt-2 text-sm">
              None of the options needs a subsidy, levy or guarantee. Private investors would carry the risk.
            </p>
          </div>
        </div>
      </Section>

      <Section title="The problem and the counterpart">
        <PairedFigure
          green={{
            label: 'Compensation for turned-away wind',
            value: `≈ ${eurModel(y.cost.central)}`,
            gloss: `Modelled range ${eurRange(y.cost.low, y.cost.high)} for ${gwh(y.windMwh)} in ${y.year} — ≈ ${eurModel(y.costPerHousehold.central)} per household`,
            tags: costTags(y),
          }}
          orange={{
            label: 'The same energy, mined at today’s network',
            value: `≈ ${eurModel(e.revenue.revenueEur)}`,
            gloss: `≈ ${btcFigure(e.revenue.btcNet)} gross revenue, before costs — the net result is below`,
            tags: btcTags(market),
          }}
        />
        <div className="mt-4">
          <NotFinancialAdvice priceEur={market.priceEur} asOf={asOf} live={market.live} />
        </div>
      </Section>

      <Section title="Does it pay?">
        <p className="prose-body max-w-3xl">
          Revenue is only half the picture. A fleet that runs only on surplus has to be big enough for the surplus when
          it comes, and sits idle the rest of the time. With surplus available for{' '}
          {num(DEFAULT_MINING_COSTS.surplusHoursPerYear)} hours a year, absorbing the {y.year} volume takes a fleet of
          ≈ {num(Math.round(e.fleetMw / 10) * 10)} MW running {pct(e.utilisationPct, 0)} of the year.
        </p>
        <Callout tone={e.netEur >= 0 ? 'info' : 'warn'} title="Under our central assumptions">
          {e.netEur >= 0 ? (
            <p>
              The fleet would earn ≈ {eurModel(e.netEur)} a year after costs, and breaks even at ≈{' '}
              {eurModel(e.breakEvenPriceEur)} per BTC.
            </p>
          ) : (
            <p>
              At today&apos;s price the fleet would <strong>not</strong> cover its costs: ≈ {eurModel(e.revenue.revenueEur)}{' '}
              of revenue against ≈ {eurModel(e.totalAnnualCostEur)} of costs a year. It breaks even at ≈{' '}
              {eurModel(e.breakEvenPriceEur)} per BTC, or with cheaper hardware, more hours of surplus, or no network
              charges behind the meter. Change the assumptions below.
            </p>
          )}
        </Callout>
        <div className="mt-6">
          <MiningCalculator defaultGwh={y.windMwh / 1000} market={market} />
        </div>
      </Section>

      <Section title="How it compares with the alternatives">
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Ways to use or avoid surplus wind, compared</caption>
            <thead>
              <tr className="border-b border-ink-700 text-left">
                {['Option', 'What it does', 'Time to deliver', 'Who pays', 'Limits'].map((h) => (
                  <th key={h} scope="col" className="py-2 pr-4 font-display text-[13px] font-medium uppercase tracking-[0.08em] text-ink-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALTERNATIVES.map((a) => (
                <tr key={a.name} className="border-b border-ink-200 align-top">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{a.name}</th>
                  <td className="py-2.5 pr-4">{a.does}</td>
                  <td className="py-2.5 pr-4">{a.time}</td>
                  <td className="py-2.5 pr-4">{a.pays}</td>
                  <td className="py-2.5">{a.limits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="prose-body mt-3 max-w-3xl text-sm">
          These are complements, not rivals: the grid needs reinforcing whatever else happens. Flexible mining&apos;s
          distinguishing features are speed and private funding; its weaknesses are volatile revenue and public
          acceptance.
        </p>
      </Section>

      <Section title="Three policy options">
        <div className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((o) => (
            <div key={o.id} className="flex flex-col border border-orange-200 bg-orange-100 p-5">
              <p className="figure text-[40px] text-orange-700">{o.id}</p>
              <h3 className="mt-2 text-[20px]">{o.t}</h3>
              <p className="prose-body mt-2 text-sm">{o.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-600">
          Options A and B are technology-neutral: they help batteries, electrolysers and demand response as much as
          mining. Option C tests the claims on this site with published data.
        </p>
      </Section>

      <Section title="Objections, answered">
        <div className="grid gap-4 md:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div key={o.q} className="card">
              <h3 className="font-semibold text-ink">{o.q}</h3>
              <p className="prose-body mt-2">{o.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Looking ahead: a 20-year scenario">
        <p className="prose-body mb-3 max-w-3xl">
          A <strong>scenario, not a prediction</strong>: renewable capacity follows Ireland&apos;s published targets, and
          dispatch-down rises with it on a grid that is not reinforced. Move the sliders to test the assumptions.
        </p>
        <Callout tone="warn" title="Read this first">
          New transmission, storage, the Celtic Interconnector and changes to system operating limits could all cut
          dispatch-down on their own. Bitcoin revenue halves at each halving and moves with the price. Treat every
          figure below as an illustration of the assumptions, not an expectation.
        </Callout>
        <div className="mt-6">
          <ForecastExplorer market={market} />
        </div>
      </Section>

      <Section>
        <div className="rounded-sm bg-peat p-8 text-center text-white">
          <h2 className="text-2xl font-semibold !text-white">Want to help?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-white/90">
            Policymakers, renewable operators with constrained sites, and anyone who wants the data published — there
            is a way to get involved.
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
