import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section, Callout, NotFinancialAdvice } from '@/components/ui';
import {
  DEFAULT_ASSUMPTIONS,
  FALLBACK_BTC_MARKET,
  computeBtcSavings,
  computeCost,
  DEFAULT_COST_ASSUMPTIONS,
} from '@/lib/methodology';
import { eur, energy, num, btc, pct } from '@/lib/format';

export const metadata: Metadata = {
  title: 'About & Methodology',
  description:
    'Who is behind Irish Grid, and the full transparent methodology: how wasted energy, cost to billpayers and Bitcoin-mineable value are calculated, with worked examples, assumptions and data sources.',
};

const A = DEFAULT_ASSUMPTIONS;
const M = FALLBACK_BTC_MARKET;

// Worked example: 1,000 GWh over a year.
const EX_WASTED_MWH = 1_000_000;
const exBtc = computeBtcSavings(EX_WASTED_MWH, 8760, A, M);
const exCost = computeCost(
  { totalMwh: EX_WASTED_MWH, curtailmentMwh: 700_000, constraintMwh: 300_000 },
  DEFAULT_COST_ASSUMPTIONS,
  { nBillpayers: A.nBillpayers, nPeople: A.nPeople },
);

const SOURCES = [
  ['EirGrid Smart Grid Dashboard (ROI)', 'Live fuel mix, generation, demand, wind, SNSP, CO₂, interconnectors', 'https://www.smartgriddashboard.com/'],
  ['EirGrid Annual Constraint & Curtailment Reports', 'Authoritative annual dispatch-down volumes (2022–2024)', 'https://www.eirgrid.ie/'],
  ['EirGrid Connected & Contracted Generators list', 'Generator names, fuel, capacity, operator', 'https://www.eirgrid.ie/'],
  ['OpenStreetMap (power=plant/generator)', 'Generator coordinates', 'https://www.openstreetmap.org/'],
  ['SEMOpx', 'Wholesale (day-ahead) electricity prices', 'https://www.semopx.com/'],
  ['CoinGecko', 'BTC price (EUR)', 'https://www.coingecko.com/'],
  ['mempool.space', 'Network hashrate & difficulty', 'https://mempool.space/'],
  ["EirGrid/SONI Tomorrow's Energy Scenarios", 'Long-range pathways for the 20-year forecast', 'https://www.eirgrid.ie/'],
];

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy-100 py-1.5 text-sm">
      <dt className="text-navy-600">{k}</dt>
      <dd className="font-medium text-navy-900">{v}</dd>
    </div>
  );
}

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="About & Methodology"
        title="Every number on this site, explained"
        intro="Irish Grid is an independent advocacy project built entirely on public data. This page shows exactly how each figure is derived — because the data is only persuasive if it's transparent."
      />

      <Section title="Who's behind Irish Grid">
        <p className="prose-body max-w-3xl">
          Irish Grid is an <strong>independent project</strong>. It is <strong>not affiliated with, endorsed
          by, or connected to EirGrid, SONI</strong>, or any system operator. Our mission is to make three
          things undeniable: Ireland generates clean energy it cannot use; that waste has a cost that lands
          on billpayers; and there is a way to turn that waste into value with flexible, interruptible demand.
        </p>
      </Section>

      <Section title="1 · Wasted energy (dispatch-down)">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-navy-900">Year views — official actuals</h3>
            <p className="prose-body mt-2">
              For full-year figures we use the <strong>official annual dispatch-down volumes</strong> from
              EirGrid&apos;s Constraint &amp; Curtailment reports (split into curtailment vs constraint where
              published). These are labelled <span className="badge-actual">✓ actual</span>.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-navy-900">Short periods — modelled estimates</h3>
            <p className="prose-body mt-2">
              For day/week/month views we estimate dispatch-down from live data as{' '}
              <code className="rounded bg-navy-50 px-1">available_wind − dispatched_wind</code> for the period.
              These are labelled <span className="badge-estimate">≈ estimate</span> and are not official actuals.
            </p>
          </div>
        </div>
      </Section>

      <Section title="2 · Cost to billpayers">
        <p className="prose-body max-w-3xl">
          The headline cost is modelled as the <strong>compensation / constraint payments</strong> to
          generators — <em>not</em> a naïve volume × price. Crucially, system-wide <strong>curtailment</strong>{' '}
          is often <strong>uncompensated</strong> for newer (non-priority-dispatch) generators, whereas local{' '}
          <strong>constraints</strong> are generally compensated. So we separate the wasted <em>volume</em>{' '}
          from the compensated <em>cost</em>.
        </p>
        <div className="mt-4 card max-w-2xl">
          <h3 className="mb-2 font-semibold text-navy-900">Worked example — 1,000 GWh dispatched down</h3>
          <dl>
            <Row k="Curtailment volume" v={energy(700_000)} />
            <Row k="Constraint volume" v={energy(300_000)} />
            <Row k={`Compensated (curtailment ${pct(DEFAULT_COST_ASSUMPTIONS.compensatedShareCurtailment * 100, 0)}, constraint ${pct(DEFAULT_COST_ASSUMPTIONS.compensatedShareConstraint * 100, 0)})`} v={energy(exCost.compensatedMwh)} />
            <Row k={`× ${eur(DEFAULT_COST_ASSUMPTIONS.compensationPriceEurPerMwh)}/MWh`} v={eur(exCost.costEur, { compact: true })} />
            <Row k={`Cost per billpayer (÷ ${num(A.nBillpayers)})`} v={eur(exCost.costPerBillpayerEur)} />
            <Row k={`Cost per person (÷ ${num(A.nPeople)})`} v={eur(exCost.costPerPersonEur)} />
          </dl>
        </div>
      </Section>

      <Section title="3 · Bitcoin-mineable value & savings">
        <p className="prose-body max-w-3xl">
          For a given wasted-energy figure, we compute how much BTC an interruptible fleet could mine, and its
          value. We show every intermediate so the figure is auditable.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 font-semibold text-navy-900">Formula</h3>
            <pre className="overflow-x-auto rounded-lg bg-navy-800 p-4 text-xs leading-relaxed text-navy-50">
{`usable_MWh   = wasted_MWh × uptime
total_TH     = (usable_MWh × 1000 × 3.6e6 J) / efficiency_J_per_TH
fleet_TH/s   = total_TH / period_seconds
share        = fleet_TH/s / network_TH/s
btc_gross    = blocks_in_period × block_reward × share
btc_net      = btc_gross × (1 − pool_fee)
value_eur    = btc_net × btc_price_eur
saving/head  = value_eur / n_billpayers`}
            </pre>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold text-navy-900">Worked example — 1,000 GWh / year</h3>
            <dl>
              <Row k="Usable energy (× uptime)" v={energy(exBtc.usableEnergyMwh)} />
              <Row k="Avg fleet hashrate" v={`${num(exBtc.fleetHashrateThs / 1e6, 2)} EH/s`} />
              <Row k="Network share" v={pct(exBtc.networkSharePct, 2)} />
              <Row k="BTC mined (net)" v={btc(exBtc.btcMinedNet)} />
              <Row k="Value" v={eur(exBtc.valueEur, { compact: true })} />
              <Row k="Saving per billpayer" v={eur(exBtc.savingPerBillpayerEur)} />
            </dl>
          </div>
        </div>
      </Section>

      <Section title="4 · Default assumptions (editable in admin)">
        <div className="card max-w-2xl">
          <dl>
            <Row k="Miner efficiency" v={`${A.efficiencyJPerTh} J/TH (S21-class)`} />
            <Row k="Uptime factor (interruptible)" v={pct(A.uptimeFactor * 100, 0)} />
            <Row k="Pool fee" v={pct(A.poolFee * 100, 1)} />
            <Row k="Block reward" v={btc(A.blockRewardBtc)} />
            <Row k="Sell / hold split" v={`${pct(A.sellShareMonthly * 100, 0)} sold / ${pct((1 - A.sellShareMonthly) * 100, 0)} held`} />
            <Row k="Billpayers (domestic accounts)" v={num(A.nBillpayers)} />
            <Row k="Population" v={num(A.nPeople)} />
            <Row k="Households (forecast)" v={num(A.nHouseholds)} />
            <Row k="BTC price / difficulty / hashrate" v="Live from APIs, cached hourly" />
          </dl>
        </div>
        <Callout tone="info" title="These are transparent defaults, not fixed truth">
          Every assumption is editable in the admin panel and recomputes figures without a redeploy. They are
          shown next to derived figures throughout the site.
        </Callout>
      </Section>

      <Section title="Data sources">
        <div className="card">
          <ul className="divide-y divide-navy-100">
            {SOURCES.map(([name, use, href]) => (
              <li key={name} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 hover:underline">{name}</a>
                <span className="text-sm text-navy-600">{use}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="prose-body mt-3 text-sm">
          We cite these sources and respect their terms of use. Generator coordinates and the &ldquo;major
          sites&rdquo; selection are a curated seed set pending final sourcing confirmation.
        </p>
      </Section>

      <Section title="Disclaimers">
        <div className="space-y-4">
          <Callout tone="proposal" title="Independence">
            Irish Grid is an independent project and is not affiliated with EirGrid or SONI.
          </Callout>
          <NotFinancialAdvice />
          <Callout tone="warn" title="Estimates vs actuals">
            Short-period curtailment and cost figures are modelled estimates and are clearly distinguished
            from official annual actuals throughout the site.
          </Callout>
        </div>
      </Section>
    </>
  );
}
