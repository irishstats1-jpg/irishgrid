import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';

export const metadata: Metadata = { title: 'Withdraw your pledge', robots: { index: false, follow: false } };

// The emailed link opens this page; only the button (a POST) acts. Mail
// scanners that pre-open links therefore can't act on someone's behalf.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token = '' } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Pledge" title="Withdraw your pledge" intro="Press the button to withdraw your pledge. Your name, organisation and email will be deleted." />
      <Section>
        <form method="post" action="/api/pledge/withdraw">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn-primary">Withdraw and delete my details</button>
        </form>
      </Section>
    </>
  );
}
