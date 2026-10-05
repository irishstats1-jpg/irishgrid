import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, TagRow, type TagSpec } from '@/components/ui';
import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { btcTags, costTags, volumeTags } from '@/lib/basis';
import { eurModel, eurRange, gwh, pct } from '@/lib/format';
import { INDEPENDENCE_LINE, SITE_URL } from '@/lib/site';

export const revalidate = 3600;
export const metadata: Metadata = {
  alternates: { canonical: '/press' },
  title: 'Press',
  description: 'Key figures with their sources, boilerplate, logos and embeddable widgets for journalists covering wind dispatch-down in Ireland.',
};

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await refreshLiveData();
  const y = getHeadlineYear();
  const market = getBtcMarket();

  const figures: Array<{ label: string; value: string; note: string; tags: TagSpec[] }> = [
    {
      label: `Wind power turned away in Ireland, ${y.year}`,
      value: gwh(y.windMwh),
      note: `${y.sourceTitle}.`,
      tags: volumeTags(y),
    },
    {
      label: 'Share of available wind turned away',
      value: y.windPctOfAvailable !== null ? pct(y.windPctOfAvailable) : '—',
      note: 'Same report. Across the whole island the share was higher.',
      tags: volumeTags(y),
    },
    {
      label: 'Compensation, modelled',
      value: `≈ ${eurModel(y.cost.central)}`,
      note: `Range ${eurRange(y.cost.low, y.cost.high)}; ≈ ${eurModel(y.costPerHousehold.central)} per household. Not a published figure — please describe it as an Irish Grid estimate.`,
      tags: costTags(y),
    },
    {
      label: 'Gross mining revenue from that energy†',
      value: `≈ ${eurModel(y.mining.revenue.revenueEur)}`,
      note: `Before costs, at today's price and network. Net of costs, under our central assumptions: ≈ ${eurModel(y.mining.netEur)}.`,
      tags: btcTags(market),
    },
  ];

  const assets = [
    { title: 'Logo (SVG)', href: '/press/irish-grid-logo.svg', note: 'Mark and wordmark' },
    { title: `Key figure card — ${y.year}`, href: `/api/social-card?year=${y.year}`, note: '1200×630 SVG' },
    { title: 'Data (CSV)', href: '/api/data/dispatch-down', note: 'The annual series with sources' },
    { title: 'Modelled figures (CSV)', href: '/api/data/annual-metrics', note: 'Cost range and Bitcoin figures by year' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Press"
        title="For journalists"
        intro={
          <>
            Key figures with their sources, and what each one is. Reported figures can be quoted as EirGrid&apos;s;
            modelled figures are Irish Grid estimates and should be described that way. The{' '}
            <Link href="/methodology" className="link">method page</Link> shows how each is made.
          </>
        }
      />

      <Section title="Key figures">
        <div className="grid gap-4 md:grid-cols-2">
          {figures.map((f) => (
            <div key={f.label} className="card flex flex-col">
              <p className="text-sm font-medium text-ink-700">{f.label}</p>
              <p className="figure mt-2 text-[44px] text-ink">{f.value}</p>
              <p className="mt-2 text-sm text-ink-600">{f.note}</p>
              <TagRow tags={f.tags} className="mt-auto pt-3" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Downloads">
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((a) => (
            <a key={a.title} href={a.href} target="_blank" rel="noopener noreferrer" className="card flex items-center justify-between transition hover:bg-ink-50">
              <div>
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="text-sm text-ink-600">{a.note}</p>
              </div>
              <span className="text-green-700" aria-hidden>↓</span>
            </a>
          ))}
        </div>
      </Section>

      <Section title="Embeddable widgets">
        <p className="prose-body mb-4 max-w-3xl">Free to embed on any site or article. Copy the snippet:</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Key figures', path: 'cost', w: 360, h: 260 },
            { name: 'Generator map', path: 'map', w: 440, h: 640 },
            { name: 'Mining calculator', path: 'calculator', w: 720, h: 900 },
          ].map((wgt) => (
            <div key={wgt.path} className="card">
              <p className="font-semibold text-ink">{wgt.name}</p>
              <pre className="mt-2 overflow-x-auto rounded-sm bg-peat p-3 text-[11px] leading-relaxed text-white/90">{`<iframe
  src="${SITE_URL}/widget/${wgt.path}"
  width="${wgt.w}" height="${wgt.h}"
  style="border:0" loading="lazy"
  title="Irish Grid — ${wgt.name}"></iframe>`}</pre>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Boilerplate">
        <div className="card max-w-3xl">
          <p className="prose-body">
            Irish Grid publishes independent evidence on Ireland&apos;s electricity grid: how much wind power is turned
            away, what it is likely to cost electricity customers, and options for using the surplus, including flexible
            demand. Reported figures come from EirGrid and SONI&apos;s annual Constraint and Curtailment reports; modelled
            figures are published with their assumptions. {INDEPENDENCE_LINE}
          </p>
          <p className="prose-body mt-3 text-sm text-ink-600">Media contact: press@irishgrid.com</p>
        </div>
      </Section>
    </>
  );
}
