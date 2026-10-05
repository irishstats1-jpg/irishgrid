import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, NotFinancialAdvice, TagRow, Takeaway } from '@/components/ui';
import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { asOfDate } from '@/lib/basis';
import { gwh, num, pct } from '@/lib/format';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/bitcoin' },
  title: 'The flexible load — how Bitcoin mining uses electricity',
  description:
    'A plain-English briefing on the Bitcoin network: how mining works, how much electricity it uses, why it can be switched off in seconds, and the fair criticisms of it.',
};

/** Assumed average efficiency of the whole global fleet (newer machines are ≈ 17.5 J/TH). */
const FLEET_AVERAGE_J_PER_TH = 20;
/** Ireland's metered electricity consumption, 2024 (CSO, June 2025): 31,900 GWh. */
const IRELAND_DEMAND_TWH = 31.9;

const STEPS = [
  {
    n: 1,
    t: 'Transactions are bundled',
    b: 'Pending payments from around the world are grouped into a candidate “block”.',
  },
  {
    n: 2,
    t: 'Computers compete to seal the block',
    b: 'Miners repeatedly guess a number that makes the block’s digital fingerprint (its “hash”) fall below a target. There is no shortcut: each guess is a calculation, and the network makes hundreds of billions of billions of them a second. This is “proof of work”.',
  },
  {
    n: 3,
    t: 'A winner is paid',
    b: 'About every ten minutes one miner finds a valid answer. Every other computer checks it, and the winner receives newly issued bitcoin (3.125 BTC per block until the 2028 halving) plus transaction fees.',
  },
  {
    n: 4,
    t: 'Difficulty adjusts itself',
    b: 'If more machines join, the target gets harder so blocks stay at about ten minutes; if machines leave, it gets easier. The adjustment happens every 2,016 blocks, roughly every two weeks.',
  },
];

const PROPERTIES = [
  {
    icon: 'pin',
    t: 'It can go to the power',
    b: 'A mining unit is a container of computers with a power and internet connection. It can sit beside a wind farm at the edge of the grid, so the energy does not have to travel to find a customer.',
  },
  {
    icon: 'power',
    t: 'It can stop in seconds',
    b: 'Mining has no deadline and no product spoiled by stopping. A site can shut down within seconds to minutes on a grid signal and lose only the revenue for that time.',
  },
  {
    icon: 'clock',
    t: 'It buys at any hour',
    b: 'The network runs around the clock, so a mining site will use surplus power at 3 a.m. on a windy Sunday as readily as at noon.',
  },
  {
    icon: 'coin',
    t: 'It pays its own way — or does not run',
    b: 'It is privately funded and earns from a global market. If it is restricted to surplus power, it does not compete with homes or businesses for supply.',
  },
];

const CRITICISMS = [
  {
    q: 'It uses a great deal of electricity.',
    a: 'True — the network as a whole uses more electricity than Ireland. The question for Ireland is narrower: whether some of that demand could run on power that is already being turned away, and stop when anyone else needs it.',
  },
  {
    q: 'The hardware becomes waste.',
    a: 'Mining machines are specialised and are replaced every few years as more efficient models appear. Any scheme should set recycling and decommissioning obligations.',
  },
  {
    q: 'Sites can be noisy.',
    a: 'Air-cooled sites are loud. Planning conditions, immersion cooling and siting away from homes all apply, as they would to any industrial load.',
  },
  {
    q: 'The price is volatile.',
    a: 'Revenue follows the bitcoin price and falls by half at each halving. That is a risk for the investor, which is why this site shows break-even prices rather than a single forecast — and why no public money should be at stake.',
  },
];

export default async function BitcoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await refreshLiveData();
  const market = getBtcMarket();
  const y = getHeadlineYear();
  const asOf = asOfDate(market.asOf);
  const ehs = market.networkHashrateThs / 1e6;
  const networkGw = (market.networkHashrateThs * FLEET_AVERAGE_J_PER_TH) / 1e9;
  const networkTwh = (networkGw * 8760) / 1000;
  const irelandAvgMw = y.windMwh / 8760;

  const scale = [
    {
      stat: `≈ ${num(Math.round(ehs / 10) * 10)} EH/s`,
      label: 'Network hashrate',
      body: `Guesses per second across the whole network, on ${asOf} (mempool.space).`,
    },
    {
      stat: `≈ ${num(Math.round(networkGw))} GW`,
      label: 'Continuous electricity demand',
      body: `≈ ${num(Math.round(networkTwh / 10) * 10)} TWh a year — about ${num(Math.round(networkTwh / IRELAND_DEMAND_TWH))}× Ireland’s metered electricity use in 2024 (CSO). Modelled at an assumed fleet average of ${FLEET_AVERAGE_J_PER_TH} J/TH.`,
    },
    {
      stat: '~10 minutes',
      label: 'Between blocks',
      body: 'The network has added a block about every ten minutes since 2009.',
    },
    {
      stat: '21 million',
      label: 'Maximum supply',
      body: 'New issuance halves about every four years. Over 95% of all bitcoin has already been issued.',
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="02 · An Líonra Bitcoin — The flexible load"
        step={2}
        title="An electricity user that can stop in seconds"
        intro={
          <>
            Step 01 showed the problem: clean power Ireland turns away and pays for. Using it needs a buyer that can
            take power whenever there is a surplus, stop whenever there is not, and sit where the wind is. Bitcoin
            mining is one such load. This page explains what it is and how it uses electricity — including the fair
            criticisms — without asking anyone to like it.
          </>
        }
      />

      <Section title="What it is">
        <p className="prose-body max-w-3xl">
          Bitcoin is a payment network and a digital asset that runs without a central operator. Thousands of
          independent computers keep copies of one shared ledger and agree, about every ten minutes, on which
          transactions to add. Supporters value it because no single company or government controls it; critics point
          to its energy use and its price swings. Both facts matter here.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scale.map((s) => (
            <div key={s.label} className="card">
              <p className="figure text-[34px] text-ink">{s.stat}</p>
              <p className="mt-1 font-semibold text-ink">{s.label}</p>
              <p className="prose-body mt-2 text-sm">{s.body}</p>
            </div>
          ))}
        </div>
        <TagRow
          className="mt-3"
          tags={[
            { kind: 'period', label: asOf },
            { kind: 'method', label: market.live ? 'mempool.space · CoinGecko' : 'Stored snapshot · mempool.space' },
            { kind: 'method', label: 'Electricity demand modelled' },
          ]}
        />
        <p className="mt-2 text-[13px] text-ink-600">
          The Cambridge Bitcoin Electricity Consumption Index is the standard independent estimate of the
          network&apos;s electricity use:{' '}
          <a href="https://ccaf.io/cbnsi/cbeci" target="_blank" rel="noopener noreferrer" className="link">ccaf.io/cbnsi/cbeci</a>.
        </p>
      </Section>

      <Section title="How mining works">
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink-100 font-display text-[18px] font-semibold text-ink">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold text-ink">{s.t}</h3>
                <p className="prose-body mt-1 text-sm">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Why it uses electricity">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="prose-body space-y-4">
            <p>
              The electricity is how the ledger is secured. Rewriting past transactions would mean redoing the work
              faster than the rest of the network combined, so the cost of attacking it rises with the energy the
              honest network spends.
            </p>
            <p>
              Because the work can be done anywhere with power and an internet connection, miners go wherever
              electricity is cheapest — and cheapest is often power that would otherwise be wasted: stranded gas,
              spilled hydro, or curtailed wind.
            </p>
          </div>
          <Callout tone="proposal" title="The scale, for Ireland">
            <p>
              Spread over the year, the {gwh(y.windMwh)} of wind turned away in Ireland in {y.year} averages ≈{' '}
              {num(Math.round(irelandAvgMw))} MW — enough to run about{' '}
              {pct(y.mining.revenue.networkSharePct, 1)} of the network at today&apos;s efficiency. In practice the
              surplus comes in bursts, so a site sized to catch it would be larger and idle much of the time. That is
              the central economic question, covered in step 03.
            </p>
          </Callout>
        </div>
      </Section>

      <Section title="The properties that matter for a grid">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROPERTIES.map((p) => (
            <div key={p.t} className="card">
              <PropertyIcon name={p.icon} />
              <h3 className="mt-2 font-semibold text-ink">{p.t}</h3>
              <p className="prose-body mt-1 text-sm">{p.b}</p>
            </div>
          ))}
        </div>
        <p className="prose-body mt-4 max-w-3xl text-sm">
          Other flexible loads share some of these properties — electrolysers making hydrogen, heat storage, batteries
          and demand response from industry. Step 03 compares them.
        </p>
      </Section>

      <Section title="Fair criticisms">
        <div className="grid gap-4 md:grid-cols-2">
          {CRITICISMS.map((c) => (
            <div key={c.q} className="card">
              <h3 className="font-semibold text-ink">{c.q}</h3>
              <p className="prose-body mt-2 text-sm">{c.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
        <Callout tone="proposal" title="What is — and is not — proposed">
          <p>
            Nothing on this site argues for new power stations to run mining, or for mining that draws on power homes
            and businesses need. The option examined is narrower: a load that runs only on power the grid is already
            turning away, and stops when it is told to.
          </p>
          <Takeaway>
            For billpayers, the test is lower costs. For the climate, more clean power used. For the taxpayer, no
            public money at risk. Step 03 sets out whether it passes.
          </Takeaway>
        </Callout>
        </div>
        <div className="mt-4">
          <NotFinancialAdvice priceEur={market.priceEur} asOf={asOf} live={market.live} />
        </div>
      </Section>

      <Section>
        <div className="rounded-sm bg-peat p-6 text-white md:p-8">
          <p className="eyebrow !text-green-300">Next · 03 · An Réiteach — The policy option</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-white/90">
              The costs, the break-even price, the alternatives, and three policy options that would help any flexible
              load use Ireland&apos;s surplus.
            </p>
            <Link href="/proposal" className="btn-accent shrink-0">The policy option →</Link>
          </div>
        </div>
      </Section>
    </>
  );
}

// Simple stroke icons in the ink colour — no emoji, and no orange decoration.
const ICON_PATHS: Record<string, string> = {
  pin: 'M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  power: 'M12 3v8 M6.3 6.3a8 8 0 1 0 11.4 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9 9.5h4.5a1.75 1.75 0 0 1 0 3.5H9h5a1.75 1.75 0 0 1 0 3.5H9 M9 9.5v7 M11 8v1.5 M11 16.5V18',
};

function PropertyIcon({ name }: { name: string }) {
  return (
    <svg className="h-8 w-8 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
