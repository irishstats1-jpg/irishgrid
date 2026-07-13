import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout, Takeaway } from '@/components/ui';

export const metadata: Metadata = {
  title: 'The Bitcoin network — the world’s most flexible energy buyer',
  description:
    'A plain-English primer on the Bitcoin network: its scale, how mining actually works, why it uses energy, and why it is the most secure decentralised network ever built — and the one property that makes it useful for Ireland’s grid.',
};

const SCALE = [
  {
    stat: '$1 trillion+',
    label: 'Network value',
    body: 'Bitcoin is one of the largest monetary networks on earth, held by individuals, companies and now governments — settling value 24/7 without any bank in the middle.',
  },
  {
    stat: 'Hundreds of EH/s',
    label: 'Computing power securing it',
    body: 'The network runs at hundreds of exahashes per second — more computing power than every tech giant combined — all pointed at keeping the ledger honest.',
  },
  {
    stat: '~100 countries',
    label: 'Tens of thousands of nodes',
    body: 'No head office and no off-switch: independent computers on six continents each keep a full copy of the ledger and enforce the same rules.',
  },
  {
    stat: '~10 minutes',
    label: 'A new block, like clockwork',
    body: 'Since 2009 the network has added a new block of transactions roughly every ten minutes, essentially without interruption — one of the most reliable systems ever built.',
  },
];

const STEPS = [
  {
    n: 1,
    t: 'Transactions are bundled',
    b: 'Pending payments from around the world are grouped into a candidate “block.”',
  },
  {
    n: 2,
    t: 'Computers race to solve a puzzle',
    b: 'Miners repeatedly guess a number that makes the block’s digital fingerprint (its “hash”) fall below a target. There is no shortcut — you simply have to try, trillions of times a second. This is “proof of work.”',
  },
  {
    n: 3,
    t: 'A winner seals the block',
    b: 'Roughly every ten minutes one miner finds a valid answer, broadcasts it, and every other computer instantly checks and accepts it. The winner earns newly-issued bitcoin plus transaction fees.',
  },
  {
    n: 4,
    t: 'Difficulty self-adjusts',
    b: 'If more computing power joins, the puzzle automatically gets harder to keep blocks at ~10 minutes; if power leaves, it gets easier. The network quietly re-balances itself roughly every two weeks — no committee required.',
  },
];

const PROPERTIES = [
  {
    icon: '📍',
    t: 'It goes to the power',
    b: 'A mining unit is a shipping container of computers and an internet link. It can sit right next to a wind farm at the far end of the grid — the energy no longer has to travel to find a customer.',
  },
  {
    icon: '⚡',
    t: 'It stops in seconds',
    b: 'Unlike a smelter or a data centre full of websites, mining has no deadline. It can power down within seconds on a grid signal and lose nothing but that moment’s work.',
  },
  {
    icon: '🕒',
    t: 'It buys 24/7',
    b: 'The network never sleeps and never says “no thanks.” That makes it a guaranteed buyer for surplus energy that would otherwise be worth nothing at all.',
  },
  {
    icon: '🏦',
    t: 'It needs no subsidy',
    b: 'It is funded by private capital chasing a global market price — not by levies on your bill or grants from the taxpayer. It competes with no household for power.',
  },
];

export default async function BitcoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="Step 2 · The tool"
        title="Meet the world’s most flexible energy buyer"
        intro={
          <>
            To see how we fix the waste in Step 1, you need to understand one thing: the{' '}
            <strong>Bitcoin network</strong>. Forget the headlines and the price charts for a moment — what
            matters here is what it <em>is</em> and how it <em>behaves</em>. It turns out to have exactly the
            properties a grid drowning in surplus clean energy is crying out for.
          </>
        }
      />

      <Section title="What it actually is">
        <p className="prose-body max-w-3xl">
          At its simplest, Bitcoin is <strong>money that runs on maths instead of on any single bank,
          company or government</strong>. A worldwide web of independent computers keeps one shared,
          tamper-evident ledger and agrees, every ten minutes, on who owns what. Nobody is in charge, so
          nobody can quietly print more, freeze your account, or switch the system off. That is either
          revolutionary or unnerving depending on your politics — but it is not in dispute.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCALE.map((s) => (
            <div key={s.label} className="card">
              <p className="text-2xl font-bold text-sky-600">{s.stat}</p>
              <p className="mt-1 font-semibold text-navy-900">{s.label}</p>
              <p className="prose-body mt-2 text-sm">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-navy-400">
          Figures are rounded and illustrative of scale, not precise real-time values — network value and
          computing power move constantly. Sources: public network data (e.g. mempool.space, CoinGecko).
        </p>
      </Section>

      <Section title="How mining actually works">
        <p className="prose-body mb-6 max-w-3xl">
          &ldquo;Mining&rdquo; is just the name for the process that secures the ledger and issues new coins.
          In plain English:
        </p>
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold text-navy-900">{s.t}</h3>
                <p className="prose-body mt-1 text-sm">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Why it uses energy — and why that’s the point">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="prose-body space-y-4">
            <p>
              People often ask why the network should burn any energy at all. The honest answer:{' '}
              <strong>the energy is the security</strong>. Because writing to the ledger costs real
              electricity, rewriting history would cost more than the entire honest network is spending —
              which is astronomically expensive. There is no password to steal and no server to hack; an
              attacker would have to out-muscle the whole planet&apos;s mining power at once.
            </p>
            <p>
              That is why it is fair to call Bitcoin the <strong>most secure, decentralised network ever
              built</strong>. It has no CEO, no head office and no single point of failure. It grew the way a
              coral reef or a language grows — <em>organically</em>, by open, permissionless participation
              from millions of people who never had to ask anyone&apos;s permission to join.
            </p>
          </div>
          <Callout tone="proposal" title="The key insight for Ireland">
            <p>
              Because mining can happen <strong>anywhere there is power and an internet connection</strong>,
              and because it can be <strong>switched off instantly</strong> at no real cost, it is unlike any
              other large electricity user. It doesn&apos;t need the energy at a particular place or a
              particular time — it just needs energy that would otherwise be wasted. Hold that thought.
            </p>
          </Callout>
        </div>
      </Section>

      <Section title="The one property that matters for the grid">
        <p className="prose-body mb-6 max-w-3xl">
          Strip away everything else and four features make this the ideal home for surplus clean energy:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROPERTIES.map((p) => (
            <div key={p.t} className="card">
              <p className="text-3xl" aria-hidden>{p.icon}</p>
              <h3 className="mt-2 font-semibold text-navy-900">{p.t}</h3>
              <p className="prose-body mt-1 text-sm">{p.b}</p>
            </div>
          ))}
        </div>
        <Callout tone="info" title="“But doesn’t Bitcoin waste energy?”" >
          <p>
            It is a fair challenge — and the opposite of what&apos;s proposed here. This site is{' '}
            <strong>not</strong> arguing for building new power stations to mine Bitcoin. It argues for
            pointing this uniquely flexible, interruptible, subsidy-free buyer at the clean energy Ireland is{' '}
            <em>already</em> generating and <em>already</em> throwing away. Used that way, it doesn&apos;t
            waste energy — it <strong>rescues</strong> it.
          </p>
          <Takeaway>
            For the fiscal conservative: private capital, no subsidy, energy independence. For the
            environmentalist: better renewable economics, more clean build-out, no new fossil demand. For
            the household: lower bills. Same tool, same result.
          </Takeaway>
        </Callout>
      </Section>

      <Section>
        <div className="rounded-2xl bg-navy-700 p-6 text-white md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Next in the story</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-navy-50">
              A problem: clean energy we throw away and pay for. A tool: a flexible, interruptible, always-on
              energy buyer. Put them together and you get a solution that lowers bills, helps build more
              renewables, and costs the public nothing.
            </p>
            <Link href="/proposal" className="btn-accent shrink-0">The solution →</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
