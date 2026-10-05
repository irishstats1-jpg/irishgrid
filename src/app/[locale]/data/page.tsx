import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, BasisTag } from '@/components/ui';
import { DATA_LICENCE, DATASETS } from '@/lib/data/datasets';
import { METHOD_VERSION, REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Data',
  description:
    'Download the data behind Irish Grid as CSV or JSON: the annual wind dispatch-down series, the modelled cost and Bitcoin figures, every assumption, and the generator list — with a data dictionary. CC BY 4.0.',
};

export default async function DataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="Open data"
        title="The data, to check and reuse"
        intro={
          <>
            Every figure on the site comes from the datasets below. Reported volumes are from EirGrid and SONI;
            everything else is modelled with the assumptions on the{' '}
            <Link href="/methodology" className="link">method page</Link> (version {METHOD_VERSION}). Free to reuse under{' '}
            <a href={DATA_LICENCE.url} target="_blank" rel="noopener noreferrer" className="link">{DATA_LICENCE.name}</a>{' '}
            — please credit &ldquo;{DATA_LICENCE.attribution}&rdquo;.
          </>
        }
      />
      <Section>
        <div className="space-y-6">
          {DATASETS.map((d) => (
            <div key={d.slug} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[24px]">{d.title}</h2>
                  <p className="prose-body mt-1 max-w-3xl">{d.description}</p>
                </div>
                <BasisTag kind="method">{d.basis}</BasisTag>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-green-700">Data dictionary ({d.columns.length} columns)</summary>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm md:grid-cols-[max-content_1fr]">
                  {d.columns.map((c) => (
                    <div key={c.name} className="contents">
                      <dt className="font-mono text-[13px] text-ink">{c.name}</dt>
                      <dd className="text-ink-600">{c.description}</dd>
                    </div>
                  ))}
                </dl>
              </details>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={`/api/data/${d.slug}`} className="btn-primary" download>Download CSV</a>
                <a href={`/api/data/${d.slug}?format=json`} className="btn-outline" target="_blank" rel="noopener noreferrer">JSON</a>
              </div>
            </div>
          ))}
        </div>
        <p className="prose-body mt-6 max-w-3xl text-sm">
          The code that produces these files is public on{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link">GitHub</a>. Reported figures are
          changed only by a public code change, so their history is visible there.
        </p>
      </Section>
    </>
  );
}
