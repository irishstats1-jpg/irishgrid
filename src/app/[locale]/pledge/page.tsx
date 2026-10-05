import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';
import { PledgeForm } from '@/components/PledgeForm';
import { getPledgeCount } from '@/lib/integrations';

export const metadata: Metadata = {
  title: 'Pledge your support',
  description:
    'Sign the Irish Grid pledge: end the waste of Ireland’s clean power and let flexible demand use surplus renewable electricity at constrained sites, without subsidy.',
};

export default async function PledgePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status } = await searchParams;
  const count = await getPledgeCount();
  return (
    <>
      <PageHeader
        eyebrow="Pledge"
        title="Add your name"
        intro="A statement of support, counted once you confirm it by email. It takes a minute and helps make the case to decision-makers."
      />
      <Section>
        <PledgeForm count={count} initialStatus={status} />
      </Section>
    </>
  );
}
