import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section } from '@/components/ui';
import { DATA_LICENCE } from '@/lib/data/datasets';
import { INDEPENDENCE_LINE, REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'How you may reuse Irish Grid’s text, data and charts (CC BY 4.0), and the limits of what the figures claim.',
};

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-[24px]">{children}</h2>;
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader eyebrow="Terms" title="Terms of use" intro="Last updated 5 October 2026." />
      <Section>
        <div className="prose-body max-w-3xl space-y-3">
          <H>Reusing our work</H>
          <p>
            Text, charts and data on this site are published under the{' '}
            <a href={DATA_LICENCE.url} target="_blank" rel="noopener noreferrer" className="link">
              Creative Commons Attribution 4.0 licence ({DATA_LICENCE.name})
            </a>
            . You may copy, adapt and republish them, including commercially, provided you credit &ldquo;
            {DATA_LICENCE.attribution}&rdquo; and link to the page or dataset you used. The embeddable widgets may be
            used on any site.
          </p>
          <p>
            Figures from EirGrid, SONI, the CSO and other sources remain subject to their publishers&apos; terms; we
            cite each one. The Irish Grid name and logo identify this site: please don&apos;t use them in a way that
            suggests we endorse you. The site&apos;s code is on{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link">GitHub</a>.
          </p>

          <H>What the figures are</H>
          <p>
            Reported figures are taken from the sources named beside them. Modelled figures — every cost and every
            Bitcoin figure — are estimates built on the assumptions on the{' '}
            <Link href="/methodology" className="link">method page</Link>, and are marked ≈. They are for public
            information and debate. They are not financial, investment, legal or engineering advice, and nothing on the
            site is an offer or a recommendation to buy or sell anything.
          </p>

          <H>Accuracy and corrections</H>
          <p>
            We work to get every figure right and correct mistakes in public. If you find one, please tell us — see{' '}
            <Link href="/methodology" className="link">Corrections</Link>. We cannot accept liability for decisions made
            on the basis of the site, to the extent the law allows.
          </p>

          <H>Independence</H>
          <p>{INDEPENDENCE_LINE}</p>

          <H>Privacy</H>
          <p>
            How we handle personal data is set out in the <Link href="/privacy" className="link">privacy notice</Link>.
          </p>
        </div>
      </Section>
    </>
  );
}
