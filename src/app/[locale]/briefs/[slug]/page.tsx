import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { IndexMark } from '@/components/Wordmark';
import { JsonLd } from '@/components/JsonLd';
import { PairedFigure } from '@/components/ui';
import { PrintButton } from '@/components/PrintButton';
import { BRIEFS, briefOneFigures, getBrief } from '@/lib/briefs';
import { HOUSEHOLDS } from '@/lib/data/dispatchDown';
import { asOfDate, btcFigure, priceLabel } from '@/lib/basis';
import { eurModel, eurRange, gwh, pct } from '@/lib/format';
import { INDEPENDENCE_LINE, METHOD_VERSION, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return BRIEFS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = getBrief(slug);
  if (!b) return { title: 'Not found' };
  return {
    title: `${b.title} — Policy brief no. ${b.no}`,
    description: b.standfirst,
    alternates: { canonical: `/briefs/${b.slug}` },
    openGraph: { title: b.title, description: b.standfirst, type: 'article', publishedTime: b.published },
  };
}

const OPTIONS = [
  {
    id: 'A',
    t: 'Publish dispatch-down data by node and hour.',
    b: 'Annual totals hide where and when the surplus occurs. Hourly data by grid location would let any flexible load — batteries, electrolysers, heat, mining — be sited where it helps, and let the public check what dispatch-down costs.',
  },
  {
    id: 'B',
    t: 'Define interruptible flexible demand in connection policy.',
    b: 'A connection category for demand that runs only when the system has surplus and stops on instruction, with faster connection in return. Loads that cannot meet the terms do not qualify.',
  },
  {
    id: 'C',
    t: 'Pilot co-location at a constrained renewable site.',
    b: 'A time-limited, privately funded pilot behind the meter at a wind farm with high constraint, publishing hours run, energy used, response times and the effect on compensation.',
  },
];

export default async function BriefPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const b = getBrief(slug);
  if (!b) notFound();
  const { year: y, series, market } = briefOneFigures();
  const first = series[0];
  const provisional = series.find((m) => m.method !== 'reported');
  const e = y.mining;

  return (
    <article className="bg-paper print:bg-white">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Report',
          name: b.title,
          headline: b.title,
          description: b.standfirst,
          datePublished: b.published,
          inLanguage: 'en-IE',
          url: `${SITE_URL}/briefs/${b.slug}`,
          author: { '@type': 'Organization', name: 'Irish Grid', url: SITE_URL },
          publisher: { '@type': 'Organization', name: 'Irish Grid', url: SITE_URL },
          isBasedOn: y.sourceUrl,
        }}
      />
      <div className="bg-peat text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
        <div className="container-page flex items-center justify-between gap-4 py-5">
          <span className="flex items-center gap-3">
            <IndexMark tone="dark" className="h-9 w-9" title="Irish Grid" />
            <span className="font-display text-[22px] font-semibold">Irish Grid</span>
          </span>
          <span className="font-display text-[15px] font-semibold tracking-[0.04em]">
            POLICY BRIEF NO. {b.no} · {b.date.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="container-page max-w-4xl py-10 print:max-w-none print:py-6">
        <h1 className="display text-[44px] md:text-[56px] print:text-[30px]">{b.title}</h1>
        <p className="finding mt-4 print:mt-2 print:text-[14px]">{b.standfirst}</p>

        <div className="mt-8 break-inside-avoid print:mt-4">
          <PairedFigure
            green={{
              label: 'Wind power turned away, Ireland, 2024',
              value: gwh(y.windMwh),
              gloss: `${pct(y.windPctOfAvailable ?? 0)} of available wind · reported by EirGrid and SONI`,
            }}
            orange={{
              label: 'The same energy, mined',
              value: `≈ ${eurModel(e.revenue.revenueEur)}`,
              gloss: `≈ ${btcFigure(e.revenue.btcNet)} a year, gross, before costs · at ${priceLabel(market.priceEur)} per BTC on ${asOfDate(market.asOf)}`,
            }}
          />
        </div>

        <h2 className="mt-10 text-[28px] print:mt-5 print:text-[19px]">Findings</h2>
        <ol className="mt-4 space-y-6 print:mt-2 print:space-y-3">
          <li className="break-inside-avoid">
            <p className="finding print:text-[14px]">
              1. One unit in ten of available wind was turned away in 2024, and the share has risen every year since
              2021.
            </p>
            <p className="prose-body mt-2 print:mt-1 print:text-[11.5px] print:leading-snug">
              Wind dispatch-down in Ireland rose from {gwh(first.windMwh)} ({pct(first.windPctOfAvailable ?? 0)}) in{' '}
              {first.year} to {gwh(y.windMwh)} ({pct(y.windPctOfAvailable ?? 0)}) in 2024
              {provisional ? `; preliminary rates put ${provisional.year} at about ${pct(provisional.windPctOfAvailable ?? 0)}` : ''}.
              The 2024 report attributes it roughly equally to curtailment (system-wide limits) and constraint (local
              network limits).
            </p>
          </li>
          <li className="break-inside-avoid">
            <p className="finding print:text-[14px]">
              2. What it costs is not published. We estimate {eurRange(y.cost.low, y.cost.high)} for 2024.
            </p>
            <p className="prose-body mt-2 print:mt-1 print:text-[11.5px] print:leading-snug">
              Constrained generators with firm access are generally compensated; curtailment is largely unpaid for newer
              generators. Applying assumed rates to the reported volume and split gives a central estimate of ≈{' '}
              {eurModel(y.cost.central)} — equivalent to ≈ {eurModel(y.costPerHousehold.central)} for each of Ireland&apos;s{' '}
              {HOUSEHOLDS.count.toLocaleString('en-IE')} households. The figure is modelled, and publishing the real
              one would settle it.
            </p>
          </li>
          <li className="break-inside-avoid">
            <p className="finding print:text-[14px]">3. Flexible demand could use the surplus, but the terms decide whether it pays.</p>
            <p className="prose-body mt-2 print:mt-1 print:text-[11.5px] print:leading-snug">
              A Bitcoin-mining fleet sized to absorb the 2024 surplus would earn ≈ {eurModel(e.revenue.revenueEur)} a
              year before costs. Because the surplus comes in bursts, the fleet would run about{' '}
              {pct(e.utilisationPct, 0)} of the year; on our central assumptions its costs exceed that revenue, and it
              breaks even at ≈ {eurModel(e.breakEvenPriceEur)} per BTC. Clear connection terms, hourly data and
              lower costs behind the meter change that — at no cost to the public.
            </p>
          </li>
        </ol>

        <h2 className="mt-10 text-[28px] print:mt-5 print:text-[19px]">Options</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3 print:mt-2 print:grid-cols-3 print:gap-3">
          {OPTIONS.map((o) => (
            <div key={o.id} className="break-inside-avoid border border-orange-200 bg-orange-100 p-4 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
              <p className="figure text-[32px] text-orange-700 print:text-[22px]">{o.id}</p>
              <p className="mt-1 font-display text-[19px] font-semibold leading-tight text-ink print:text-[14px]">{o.t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-800 print:text-[11px] print:leading-snug">{o.b}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-[22px] print:mt-4 print:text-[15px]">Sources</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-ink-700 print:space-y-0 print:text-[9.5px]">
          <li>
            EirGrid &amp; SONI, Annual Renewable Energy Constraint and Curtailment Reports{' '}
            {series.filter((m) => m.method === 'reported').map((m) => m.year).join(', ')}.{' '}
            <span className="break-all">cms.eirgrid.ie/taxonomy/term/27</span>
          </li>
          {provisional && (
            <li>
              {provisional.sourceTitle}. <span className="break-all">{provisional.sourceUrl}</span>
            </li>
          )}
          <li>
            {HOUSEHOLDS.source}. <span className="break-all">{HOUSEHOLDS.sourceUrl}</span>
          </li>
          <li>
            BTC price: CoinGecko; network hashrate: mempool.space; both as at {asOfDate(market.asOf)}. Mining revenue
            excludes transaction fees.
          </li>
          <li>
            Cost and mining models: Irish Grid method version {METHOD_VERSION}, {SITE_URL}/methodology. Modelled
            figures are marked ≈ and rounded to two significant figures.
          </li>
        </ol>

        <p className="mt-8 border-t border-ink-200 pt-4 text-[13px] text-ink-700 print:mt-3 print:pt-2 print:text-[9.5px]">
          {INDEPENDENCE_LINE} Bitcoin figures are illustrative and not financial advice. {SITE_URL}/briefs/{b.slug}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <PrintButton />
          <Link href="/proposal" className="btn-outline">The policy option in full</Link>
          <Link href="/methodology" className="btn-outline">Method</Link>
        </div>
      </div>
    </article>
  );
}
