import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@/components/Analytics';
import { JsonLd } from '@/components/JsonLd';
import { INDEPENDENCE_LINE, REPO_URL, SITE_URL } from '@/lib/site';
// Barlow Condensed over Barlow (Brand Book §05) — self-hosted, so pages make no
// third-party font requests and render the same everywhere.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const DESCRIPTION =
  'How much wind power Ireland turns away, what it is likely to cost electricity customers, and options for using the surplus, including flexible demand. Independent and non-partisan; no connection to EirGrid or SONI.';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Irish Grid — Independent evidence on Ireland’s electricity grid',
      template: '%s · Irish Grid',
    },
    description: DESCRIPTION,
    openGraph: { type: 'website', siteName: 'Irish Grid', locale: 'en_IE' },
    // Each page sets its own canonical (the English URL). The Irish-language
    // pages translate the site's chrome but not yet its content, so they are
    // kept out of the index until the content is translated and reviewed.
    robots: locale === 'ga' ? { index: false, follow: true } : { index: true, follow: true },
  };
}

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Irish Grid',
  alternateName: 'Eangach na hÉireann',
  url: SITE_URL,
  logo: `${SITE_URL}/press/irish-grid-logo.svg`,
  description: INDEPENDENCE_LINE,
  sameAs: [REPO_URL],
};

const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Irish Grid',
  url: SITE_URL,
  inLanguage: 'en-IE',
  description: DESCRIPTION,
};

async function loadMessages(locale: string) {
  // Direct import (rather than getMessages) keeps message loading simple and
  // framework-version-independent; server components use the getT() helper.
  return (await import(`../../../messages/${locale}.json`)).default;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await loadMessages(locale);

  return (
    <html lang={locale} className="font-sans">
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-peat focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <JsonLd data={[ORGANIZATION, WEBSITE]} />
          {/* Page content is in English; the Irish locale translates the navigation only (for now). */}
          <main id="main" className="flex-1" lang={locale === 'ga' ? 'en' : undefined}>
            {children}
          </main>
          <Footer />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
