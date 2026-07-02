'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Wordmark } from './Wordmark';

const SOURCES = [
  { label: 'EirGrid Smart Grid Dashboard', href: 'https://www.smartgriddashboard.com/' },
  { label: 'EirGrid Constraint & Curtailment Reports', href: 'https://www.eirgrid.ie/' },
  { label: 'SEMOpx wholesale prices', href: 'https://www.semopx.com/' },
  { label: 'CoinGecko · mempool.space', href: 'https://www.coingecko.com/' },
];

export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-navy-700 text-navy-50">
      <div className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Blue info boxes (§13) */}
          <div className="rounded-xl bg-navy-800 p-5">
            <h3 className="mb-2 text-sm font-semibold text-sky-400">{t('independenceTitle')}</h3>
            <p className="text-sm leading-relaxed">{t('independenceBody')}</p>
          </div>
          <div className="rounded-xl bg-navy-800 p-5">
            <h3 className="mb-2 text-sm font-semibold text-sky-400">{t('financialTitle')}</h3>
            <p className="text-sm leading-relaxed">{t('financialBody')}</p>
          </div>
          <div className="rounded-xl bg-navy-800 p-5">
            <h3 className="mb-2 text-sm font-semibold text-sky-400">{t('estimatesTitle')}</h3>
            <p className="text-sm leading-relaxed">{t('estimatesBody')}</p>
          </div>
          <div className="rounded-xl bg-navy-800 p-5">
            <h3 className="mb-2 text-sm font-semibold text-sky-400">{t('sourcesTitle')}</h3>
            <ul className="space-y-1 text-sm">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-navy-600 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Wordmark className="h-7 w-auto text-white" />
            <p className="mt-2 max-w-md text-xs text-navy-100">
              An independent advocacy project built on public data. Not affiliated with EirGrid or SONI.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            <Link href="/curtailment" className="hover:text-white">{tn('curtailment')}</Link>
            <Link href="/proposal" className="hover:text-white">{tn('proposal')}</Link>
            <Link href="/get-involved" className="hover:text-white">{tn('getInvolved')}</Link>
            <Link href="/blog" className="hover:text-white">{tn('blog')}</Link>
            <Link href="/about" className="hover:text-white">{tn('about')}</Link>
            <Link href="/press" className="hover:text-white">{tn('press')}</Link>
            <Link href="/pledge" className="hover:text-white">{tn('pledge')}</Link>
            <Link href="/data" className="hover:text-white">{tn('data')}</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-navy-100">{t('rights', { year })}</p>
      </div>
    </footer>
  );
}
