import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section } from '@/components/ui';
import { RETENTION } from '@/lib/integrations';
import { INDEPENDENCE_LINE } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy',
  description:
    'What personal data Irish Grid collects through its pledge and Get involved forms, why, on what legal basis, who processes it, how long it is kept, and your rights.',
};

const UPDATED = '5 October 2026';
const CONTACT = 'privacy@irishgrid.com';

const PROCESSORS = [
  ['Cloudflare', 'Hosts the site, protects it from abuse and limits repeated form submissions. Processes your IP address for each request.'],
  ['Supabase', 'Stores pledges and Get involved submissions in its database.'],
  ['Resend', 'Sends pledge confirmation emails and notifies us of new submissions.'],
  ['CARTO', 'Serves the map tiles. Your browser requests them directly from CARTO, which sees your IP address.'],
];

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-[24px]">{children}</h2>;
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const analytics = Boolean(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN);

  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" intro={`Last updated ${UPDATED}. We collect as little as possible and keep it no longer than needed.`} />
      <Section>
        <div className="prose-body max-w-3xl space-y-3">
          <H>Who is responsible</H>
          <p>
            Irish Grid is the data controller for the personal data described here. For any question or request about
            your data, email <a href={`mailto:${CONTACT}`} className="link">{CONTACT}</a>.
          </p>

          <H>What we collect, and why</H>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-ink-700 text-left">
                  {['What', 'Data', 'Purpose', 'Legal basis', 'Kept for'].map((h) => (
                    <th key={h} className="py-2 pr-3 font-display text-[14px] font-semibold text-ink-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-ink-200">
                  <td className="py-2 pr-3 font-medium">Pledge</td>
                  <td className="py-2 pr-3">Name, email, organisation (optional)</td>
                  <td className="py-2 pr-3">To count your support, confirm it is you, and let you withdraw</td>
                  <td className="py-2 pr-3">Your consent</td>
                  <td className="py-2">
                    Until you withdraw or the campaign ends; unconfirmed pledges are deleted after{' '}
                    {RETENTION.unconfirmedPledgeDays} days
                  </td>
                </tr>
                <tr className="border-b border-ink-200">
                  <td className="py-2 pr-3 font-medium">Get involved</td>
                  <td className="py-2 pr-3">Name, email, organisation and what you write</td>
                  <td className="py-2 pr-3">To reply to you</td>
                  <td className="py-2 pr-3">Our legitimate interest in answering people who contact us</td>
                  <td className="py-2">{Math.round(RETENTION.submissionDays / 365)} years, then deleted</td>
                </tr>
                <tr className="border-b border-ink-200">
                  <td className="py-2 pr-3 font-medium">Every visit</td>
                  <td className="py-2 pr-3">IP address, browser details</td>
                  <td className="py-2 pr-3">To deliver the site, keep it secure and limit abuse of the forms</td>
                  <td className="py-2 pr-3">Our legitimate interest in running a secure site</td>
                  <td className="py-2">Short-term logs at Cloudflare; not combined with other data</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We do not publish names, sell data, or use it for marketing. The pledge total is published; individual
            pledges are not.
          </p>

          <H>Who processes it for us</H>
          <ul className="list-disc space-y-1 pl-5">
            {PROCESSORS.map(([name, use]) => (
              <li key={name}>
                <strong>{name}</strong> — {use}
              </li>
            ))}
            {analytics && (
              <li>
                <strong>Plausible Analytics</strong> — counts page views without cookies and without storing personal
                data; hosted in the EU.
              </li>
            )}
          </ul>
          <p>
            Each provider acts under a data processing agreement. Where data is processed outside the European Economic
            Area, we rely on the safeguards in that agreement — the EU–US Data Privacy Framework or Standard Contractual
            Clauses.
          </p>

          <H>Cookies</H>
          <p>
            The public site sets no tracking cookies{analytics ? ' and its analytics are cookieless' : ' and uses no analytics'}.
            If you switch language, a cookie remembers your choice. The admin area uses a sign-in cookie. Both are
            strictly necessary for what you asked for, so no consent banner is needed.
          </p>

          <H>Your rights</H>
          <p>
            You can ask to see, correct or delete your data, to restrict or object to its use, or to receive a copy.
            Where we rely on consent, you can withdraw it at any time — every pledge confirmation email includes a link
            to withdraw, which deletes the pledge. Email <a href={`mailto:${CONTACT}`} className="link">{CONTACT}</a>;
            we reply within one month.
          </p>
          <p>
            You can also complain to the Data Protection Commission:{' '}
            <a href="https://www.dataprotection.ie/" target="_blank" rel="noopener noreferrer" className="link">dataprotection.ie</a>.
          </p>

          <H>Changes</H>
          <p>
            We will update this page if anything changes, and change the date at the top. See also the{' '}
            <Link href="/terms" className="link">terms of use</Link>.
          </p>
          <p className="pt-4 text-sm text-ink-600">{INDEPENDENCE_LINE}</p>
        </div>
      </Section>
    </>
  );
}
