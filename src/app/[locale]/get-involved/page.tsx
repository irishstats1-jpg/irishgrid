import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section } from '@/components/ui';
import { GetInvolvedForms } from '@/components/GetInvolvedForms';

export const metadata: Metadata = {
  title: 'Get involved',
  description:
    'Four ways to help end clean-energy waste in Ireland: request a policymaker briefing, make an investor/partner enquiry, host a pilot site, or volunteer.',
};

export default function GetInvolvedPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="Get involved"
        title="Four ways to help turn wasted energy into value"
        intro="Pick the pathway that fits you. Every submission reaches us directly and you'll get a confirmation by email."
      />
      <Section>
        <GetInvolvedForms />
      </Section>
    </>
  );
}
