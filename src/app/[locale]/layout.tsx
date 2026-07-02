import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@/components/Analytics';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://irishgrid.com'),
  title: {
    default: "Irish Grid — What's powering Ireland, and what we waste",
    template: '%s · Irish Grid',
  },
  description:
    "Independent, data-driven look at the Republic of Ireland's electricity grid: live sources, the clean energy we curtail, what it costs billpayers, and a proposal to turn that waste into value with flexible Bitcoin-mining load. Not affiliated with EirGrid or SONI.",
  openGraph: { type: 'website', siteName: 'Irish Grid' },
  robots: { index: true, follow: true },
  alternates: {
    languages: {
      en: '/',
      ga: '/ga',
    },
  },
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
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-navy-700 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
