import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { YearExplorer } from '@/components/YearExplorer';
import { AnnualTable } from '@/components/AnnualTable';
import { GeneratorMap } from '@/components/GeneratorMap';
import { Callout, Framed, NotFinancialAdvice, PairedFigure, TagRow, Takeaway, WhyDiffer } from '@/components/ui';
import { getAllYears, getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { ALL_ISLAND_WIND_PCT } from '@/lib/data/dispatchDown';
import { WHOLESALE_REF_EUR_PER_MWH } from '@/lib/methodology';
import { eur, eurModel, gwh, pct } from '@/lib/format';
import { approx, asOfDate, btcFigure, btcTags, volumeTags } from '@/lib/basis';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  await refreshLiveData();
  const years = getAllYears();
  const y = getHeadlineYear();
  const market = getBtcMarket();
  const asOf = asOfDate(market.asOf);
  const trend = [...years].reverse().filter((m) => m.year >= 2021 && m.windPctOfAvailable !== null);
  const islandFirst = ALL_ISLAND_WIND_PCT.find((r) => r.year === 2021);
  const islandLast = ALL_ISLAND_WIND_PCT[ALL_ISLAND_WIND_PCT.length - 1];
  const y2020 = years.find((m) => m.year === 2020);

  return (
    <>
      <section className="border-b border-ink-200">
        <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div>
            <p className="eyebrow mb-4 !text-green-700">01 · An Fhadhb — The problem</p>
            <h1 className="display text-[44px] md:text-[64px]">Ireland is paying for clean power it doesn&apos;t use.</h1>
          </div>
          <div>
            <p className="prose-body">
              In {y.year} the grid operator turned away <strong>{gwh(y.windMwh)}</strong> of wind power in Ireland —{' '}
              {y.windPctOfAvailable !== null ? `${pct(y.windPctOfAvailable)} of the wind energy available` : 'a share of the wind energy available'}{' '}
              — because the network could not take it. Some of those wind farms are compensated for the power they were
              not allowed to produce, and that cost is passed on to every electricity customer.
            </p>
            <p className="prose-body mt-3">
              This site sets out the evidence, what it is likely to cost, and one option for using the surplus. Each
              figure shows its period, its source, and whether it is reported or modelled.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/bitcoin" className="btn-accent">02 · The flexible load →</Link>
              <Link href="/methodology" className="btn-outline">How the figures are made</Link>
            </div>
          </div>
        </div>

        <div className="container-page pb-12">
          <PairedFigure
            size="lg"
            green={{
              label: 'Wind power turned away',
              value: `${approx(y)}${gwh(y.windMwh)}`,
              gloss: `Ireland, ${y.year} — the latest year with a published EirGrid report`,
              tags: volumeTags(y),
            }}
            orange={{
              label: 'The same energy, mined at today’s network',
              value: `≈ ${eurModel(y.mining.revenue.revenueEur)}`,
              gloss: (
                <>
                  ≈ {btcFigure(y.mining.revenue.btcNet)} gross revenue, before costs. Whether it covers them is set out in{' '}
                  <Link href="/proposal" className="link">step 03</Link>.
                </>
              ),
              tags: btcTags(market),
            }}
          />
          <div className="mt-4">
            <NotFinancialAdvice priceEur={market.priceEur} asOf={asOf} live={market.live} />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">Year by year</h2>
        <YearExplorer years={years} headlineYear={y.year} market={market} />
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">Curtailment is not the same as constraint</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-[22px]">Two kinds of dispatch-down</h3>
            <p className="prose-body mt-2">
              Both mean the grid operator telling a generator to produce less than it could. <strong>Curtailment</strong>{' '}
              is system-wide: there is more wind and solar than the whole island can safely run on at once.{' '}
              <strong>Constraint</strong> is local: the wires in one area cannot carry the power to where it is needed.
            </p>
          </div>
          <div className="card">
            <h3 className="text-[22px]">How it reaches bills</h3>
            <p className="prose-body mt-2">
              Generators with firm grid access are generally compensated when they are constrained; curtailment is
              largely unpaid for newer generators. When a constraint turns a wind farm down, other plant — often gas —
              is turned up elsewhere to keep supply and demand balanced. These costs are recovered through charges that
              suppliers pass on to customers.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">What it is likely to cost</h2>
        <p className="prose-body mb-4 max-w-3xl">
          No public source gives the compensation paid for wind dispatch-down each year, so the cost here is{' '}
          <strong>modelled</strong>: the volume, split into constraint and curtailment, times assumed compensation
          rates, shown as a low–high range. The volume is reported; the cost is not. The assumptions are on the{' '}
          <Link href="/methodology" className="link">method page</Link>.
        </p>
        <div className="card">
          <AnnualTable years={years} />
        </div>
        <div className="mt-6 border border-ink-200 p-5">
          <h3 className="text-[22px]">Context: replacing constrained power</h3>
          <p className="prose-body mt-2 max-w-3xl">
            When a <em>constraint</em> turns a wind farm down, the same power has to be bought from another generator.
            At a reference wholesale price of {eur(WHOLESALE_REF_EUR_PER_MWH, { decimals: 0 })}/MWh, the ≈ {gwh(y.constraintMwh)} of
            constrained wind in {y.year} is worth ≈ <strong>{eurModel(y.replacementCostEur)}</strong>. This is context,
            not an extra cost to add to the range above — and it excludes curtailment, where the power could not have
            been used at all.
          </p>
          <TagRow
            className="mt-3"
            tags={[{ kind: 'period', label: `Calendar ${y.year}` }, { kind: 'method', label: 'Modelled' }]}
          />
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-2 text-[28px] leading-[1.1] md:text-[32px]">Since 2021, a bigger share every year</h2>
        <p className="prose-body mb-6 max-w-3xl">
          Ireland aims for about 22 GW of wind and solar by 2030 under the Climate Action Plan — roughly three times
          what is connected today. Unless the grid, storage and demand keep pace, the share of clean power turned away
          grows with it.
        </p>
        <Framed className="grid bg-white sm:grid-cols-3 lg:grid-cols-5">
          {trend.map((r, i) => (
            <div
              key={r.year}
              className={`p-5 md:p-6 ${i > 0 ? 'border-t border-ink-200 sm:border-l sm:border-t-0' : ''}`}
            >
              <p className="eyebrow flex items-center gap-2 !text-ink-800">
                <span className={`inline-block h-3 w-3 ${r.method === 'reported' ? 'bg-green-500' : 'bg-green-200'}`} aria-hidden />
                {r.year}
                {r.method !== 'reported' && ' · provisional'}
              </p>
              <p className="figure mt-3 text-[44px] text-green-700">
                {approx(r)}
                {pct(r.windPctOfAvailable ?? 0)}
              </p>
            </div>
          ))}
        </Framed>
        <TagRow
          className="mt-3"
          tags={[
            { kind: 'period', label: `Calendar ${trend[0]?.year}–${trend[trend.length - 1]?.year}` },
            { kind: 'scope', label: 'Ireland · wind' },
            { kind: 'method', label: 'Share of available wind · EirGrid C&C reports' },
          ]}
        />
        <WhyDiffer>
          These are Ireland only. Across the whole island, including Northern Ireland, the share rose faster —
          {islandFirst ? ` ${pct(islandFirst.pct)} in ${islandFirst.year}` : ''} to {pct(islandLast.pct)} in{' '}
          {islandLast.year}.{y2020 && y2020.windPctOfAvailable !== null
            ? ` 2020 (${pct(y2020.windPctOfAvailable)} in Ireland) is left out: Covid-19 lockdowns cut demand that year.`
            : ''}
        </WhyDiffer>

        <div className="mt-8">
          <Callout tone="info" title="The uncomfortable maths">
            <p>
              New wires, storage and interconnectors will help, but they take years to build. Until they arrive, adding
              wind to today&apos;s grid means turning away a <em>bigger</em> share of what is built, which weakens the
              case for the projects the climate targets depend on. The question is what to do with the surplus{' '}
              <strong>in the meantime</strong>, and who pays for it.
            </p>
            <Takeaway>
              Lower bills, the climate targets and value for money all point the same way: use more of the clean power
              Ireland already produces.
            </Takeaway>
          </Callout>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="mb-2 text-[28px] leading-[1.1] md:text-[32px]">Where the large generators are</h2>
        <p className="prose-body mb-5 max-w-3xl">
          EirGrid&apos;s reports put the highest dispatch-down in the west, north-west and south-west, where wind is
          strongest and the network is thinnest.
          The map shows a selection of large generators and interconnectors for orientation; it does not show output
          or dispatch-down by site, which EirGrid does not publish.
        </p>
        <div className="card">
          <GeneratorMap />
        </div>
      </section>

      <section className="container-page pb-12">
        <div className="bg-peat p-6 text-white md:p-8">
          <p className="eyebrow !text-green-300">Next · 02 · An Líonra Bitcoin — The flexible load</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-[17px] text-white/90">
              What kind of electricity user could take this surplus when it appears, stop when homes need the power,
              and be sited where the wind is? One candidate is a network most people know only from the headlines.
            </p>
            <Link href="/bitcoin" className="btn-accent shrink-0">The flexible load →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
