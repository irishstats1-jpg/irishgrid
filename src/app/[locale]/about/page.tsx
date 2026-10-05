import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout } from '@/components/ui';
import { INDEPENDENCE_LINE, REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What Irish Grid is, what it is for, and how it keeps evidence and advocacy apart. Independent and non-partisan, with no connection to EirGrid or SONI.',
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Independent evidence on Ireland’s electricity grid"
        intro={INDEPENDENCE_LINE}
      />

      <Section title="What Irish Grid is for">
        <p className="prose-body max-w-3xl">
          Ireland turns away a growing share of the wind power it produces, and some of that is paid for by electricity
          customers. Irish Grid sets out how much, what it is likely to cost, and what could be done — starting with
          better published data. One of the options it examines is flexible demand, with Bitcoin mining as the worked
          example, because it is the option least often examined on the numbers.
        </p>
      </Section>

      <Section title="How evidence and advocacy are kept apart">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <h3 className="font-semibold text-ink">Evidence</h3>
            <p className="prose-body mt-2 text-sm">
              Steps 01 and 02, the data downloads and the method page report what is published and model what is not,
              with every assumption shown.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">Advocacy</h3>
            <p className="prose-body mt-2 text-sm">
              Step 03 and the policy briefs argue for options. They say so, and they use only figures from the evidence
              pages.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-ink">Open to checking</h3>
            <p className="prose-body mt-2 text-sm">
              The code that produces every figure is public on{' '}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link">GitHub</a>, and corrections
              are made in public.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Further reading">
        <ul className="prose-body max-w-3xl list-disc space-y-2 pl-5">
          <li>
            <Link href="/methodology" className="link">Method</Link> — how every figure is made, and the assumptions
            behind it.
          </li>
          <li>
            <Link href="/data" className="link">Data</Link> — download the series and the modelled figures.
          </li>
          <li>
            <Link href="/press" className="link">Press</Link> — key figures and boilerplate for journalists.
          </li>
        </ul>
      </Section>

      <Section title="Disclaimers">
        <div className="space-y-4">
          <Callout tone="proposal" title="Independence">
            {INDEPENDENCE_LINE}
          </Callout>
          <Callout tone="warn" title="† Bitcoin figures">
            Bitcoin figures are modelled at the price and network hashrate on the date shown, and are not financial or
            investment advice.
          </Callout>
        </div>
      </Section>
    </>
  );
}
