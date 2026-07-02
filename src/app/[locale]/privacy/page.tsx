import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Irish Grid handles the small amount of data collected through its contact, get-involved and pledge forms.',
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy note" intro="We keep this simple and collect as little as possible." />
      <Section>
        <div className="prose-body max-w-3xl space-y-4">
          <p>
            Irish Grid uses <strong>cookieless, privacy-friendly analytics</strong> that do not track you
            across sites or store personal identifiers, so we don&apos;t need a cookie-consent banner.
          </p>
          <p>
            Our <strong>Get Involved</strong>, <strong>Pledge</strong> and contact forms store only the
            information you submit (such as your name, email and message), for the sole purpose of responding
            to you or counting your pledge. We use Resend to send confirmation and notification emails.
          </p>
          <p>
            We do not sell your data or share it with third parties for marketing. You can ask us to access or
            delete your data at any time by emailing <strong>privacy@irishgrid.com</strong>.
          </p>
          <p className="text-sm text-navy-500">
            Irish Grid is an independent project and is not affiliated with EirGrid or SONI.
          </p>
        </div>
      </Section>
    </>
  );
}
