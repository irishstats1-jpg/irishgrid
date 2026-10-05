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
    <footer className="mt-16 bg-peat text-white/90">
      <div className="container-page py-12">
        <div className="grid gap-px overflow-hidden rounded-sm border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-4">
          <FooterBox title={t('independenceTitle')} body={t('independenceBody')} />
          <FooterBox title={t('financialTitle')} body={t('financialBody')} orange />
          <FooterBox title={t('estimatesTitle')} body={t('estimatesBody')} />
          <div className="bg-peat p-5">
            <h3 className="eyebrow mb-2 !text-green-300">{t('sourcesTitle')}</h3>
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

        <div className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-8 md:flex-row md:items-center md:justify-between">
          <Wordmark tone="dark" markClassName="h-7 w-7" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            <Link href="/" className="hover:text-white">{tn('home')}</Link>
            <Link href="/bitcoin" className="hover:text-white">{tn('bitcoin')}</Link>
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

        <div className="mt-8 flex flex-col gap-2 text-xs text-white/75 md:flex-row md:justify-between">
          <p>{t('independenceLine')}</p>
          <p>{t('rights', { year })}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterBox({ title, body, orange = false }: { title: string; body: string; orange?: boolean }) {
  return (
    <div className="bg-peat p-5">
      <h3 className={`eyebrow mb-2 ${orange ? '!text-orange-400' : '!text-green-300'}`}>{title}</h3>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}
