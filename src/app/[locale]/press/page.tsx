import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';
import { computePeriodMetrics } from '@/lib/data/metrics';
import { eur, energy, pct } from '@/lib/format';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Press & media kit',
  description: 'Boilerplate, key figures, logos and approved cards for journalists covering Ireland’s electricity grid and curtailment.',
};

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const y = computePeriodMetrics('2024');
  const wastedShare = y.producedMwh > 0 ? (y.wastedMwh / (y.producedMwh + y.wastedMwh)) * 100 : 0;

  const figures = [
    { label: 'Clean energy dispatched down (2024)', value: energy(y.wastedMwh) },
    { label: 'Share of output wasted', value: pct(wastedShare, 1) },
    { label: 'Modelled cost to billpayers (2024)', value: eur(y.costEur, { compact: true }) },
    { label: 'Recoverable value via flexible mining', value: eur(y.btcValueEur, { compact: true }) },
  ];

  const assets = [
    { title: 'Logo — SVG wordmark', href: '/press/irish-grid-logo.svg', note: 'Blue on white' },
    { title: 'Key figure card — 2024', href: '/api/social-card?period=year', note: '1200×630 SVG' },
    { title: 'Key figure card — last week', href: '/api/social-card?period=week', note: '1200×630 SVG' },
    { title: 'Data (CSV)', href: '/api/data/period-metrics', note: 'Computed period metrics' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Press"
        title="Media kit"
        intro="Everything a journalist needs to cover the story accurately. All figures are sourced and the methodology is public."
      />

      <Section title="Key figures">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="card">
              <p className="text-2xl font-bold text-navy-900">{f.value}</p>
              <p className="mt-1 text-sm text-navy-600">{f.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Downloads">
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((a) => (
            <a key={a.title} href={a.href} target="_blank" rel="noopener noreferrer" className="card flex items-center justify-between transition hover:shadow-md">
              <div>
                <p className="font-semibold text-navy-900">{a.title}</p>
                <p className="text-sm text-navy-600">{a.note}</p>
              </div>
              <span className="text-sky-600">↓</span>
            </a>
          ))}
        </div>
        <p className="prose-body mt-3 text-sm text-navy-500">Additional assets are managed in the admin media library.</p>
      </Section>

      <Section title="Embeddable widgets">
        <p className="prose-body mb-4 max-w-3xl">
          Free to embed on any site or article. Copy the snippet:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Live wasted-energy cost', path: 'cost', w: 360, h: 220 },
            { name: 'Mini map', path: 'map', w: 440, h: 640 },
            { name: 'Savings calculator', path: 'calculator', w: 660, h: 380 },
          ].map((wgt) => (
            <div key={wgt.path} className="card">
              <p className="font-semibold text-navy-900">{wgt.name}</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-navy-800 p-3 text-[11px] leading-relaxed text-navy-50">{`<iframe
  src="https://irishgrid.com/widget/${wgt.path}"
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
            <strong>Irish Grid</strong> is an independent, data-driven project that tracks how much clean
            electricity the Republic of Ireland wastes through curtailment, what that costs billpayers, and how
            flexible, interruptible demand — including Bitcoin mining that runs only on otherwise-curtailed
            energy — could turn that waste into value. Irish Grid is not affiliated with EirGrid or SONI. All
            figures are built on public data with a fully published methodology.
          </p>
          <p className="prose-body mt-3 text-sm text-navy-500">Media contact: press@irishgrid.com</p>
        </div>
      </Section>
    </>
  );
}
