import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section } from '@/components/ui';
import { BRIEFS } from '@/lib/briefs';

export const metadata: Metadata = {
  alternates: { canonical: '/briefs' },
  title: 'Policy briefs',
  description: 'Short, sourced policy briefs on wind dispatch-down in Ireland and options for using the surplus.',
};

export default async function BriefsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="Briefs"
        title="Policy briefs"
        intro="Two pages each, sourced, and written for policymakers and their advisers. Figures are fixed at the date of publication; the method page explains how each was made."
      />
      <Section>
        <ul className="space-y-4">
          {BRIEFS.map((b) => (
            <li key={b.slug}>
              <Link href={`/briefs/${b.slug}`} className="card block transition hover:bg-ink-50">
                <p className="eyebrow">
                  Policy brief no. {b.no} · {b.date}
                </p>
                <h2 className="mt-1 text-[28px]">{b.title}</h2>
                <p className="prose-body mt-2 max-w-3xl">{b.standfirst}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
