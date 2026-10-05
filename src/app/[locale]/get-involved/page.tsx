import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';
import { GetInvolvedForms, type Pathway } from '@/components/GetInvolvedForms';

export const metadata: Metadata = {
  alternates: { canonical: '/get-involved' },
  title: 'Get involved',
  description:
    'Request a briefing on dispatch-down and flexible demand, host or partner on a pilot at a constrained site, or support Irish Grid’s research.',
};

const PATHWAYS: Pathway[] = ['policymaker', 'pilot', 'volunteer'];

export default async function GetInvolvedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pathway?: string; status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { pathway, status } = await searchParams;
  const initialPathway = PATHWAYS.includes(pathway as Pathway) ? (pathway as Pathway) : 'policymaker';
  return (
    <>
      <PageHeader
        eyebrow="Get involved"
        title="Help put flexible demand on the policy agenda"
        intro="Choose what fits you. Every message reaches us directly; we reply to each one."
      />
      <Section>
        <GetInvolvedForms initialPathway={initialPathway} initialStatus={status} />
      </Section>
    </>
  );
}
