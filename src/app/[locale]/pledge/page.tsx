import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';
import { PledgeForm } from '@/components/PledgeForm';
import { getPledgeCount } from '@/lib/integrations';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Pledge your support',
  description: 'Sign the Irish Grid pledge: end the waste of clean energy and explore flexible demand to soak up curtailment, stabilise the grid and keep bills down.',
};

export default async function PledgePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const count = await getPledgeCount();
  return (
    <>
      <PageHeader
        eyebrow="Pledge"
        title="Add your name"
        intro="A public statement of support. It takes ten seconds and helps make the case to decision-makers."
      />
      <Section>
        <PledgeForm initialCount={count} />
      </Section>
    </>
  );
}
