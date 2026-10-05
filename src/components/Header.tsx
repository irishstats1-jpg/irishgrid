'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Wordmark } from './Wordmark';
import { LanguageToggle } from './LanguageToggle';

// The header tells one story in three steps — the problem, the flexible load,
// the policy option — and gives policy readers direct routes to the briefs,
// the data and the method (Brand Book v2.0).
const STEPS = [
  { href: '/', key: 'home', step: '01' },
  { href: '/bitcoin', key: 'bitcoin', step: '02' },
  { href: '/proposal', key: 'proposal', step: '03' },
] as const;

const REFERENCE = [
  { href: '/briefs', key: 'briefs' },
  { href: '/data', key: 'data' },
  { href: '/methodology', key: 'methodology' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const tb = useTranslations('brand');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-peat text-white print:hidden">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label={`${tb('name')} — home`}>
          <Wordmark tone="dark" markClassName="h-8 w-8" descriptor="xl" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {STEPS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`flex items-baseline gap-1.5 border-b-2 px-2.5 py-2 font-display text-[17px] font-semibold transition ${
                isActive(item.href) ? 'border-white text-white' : 'border-transparent text-white/80 hover:text-white'
              }`}
            >
              <span className="text-[12px] font-medium text-white/60">{item.step}</span>
              {t(item.key)}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-white/25" aria-hidden />
          {REFERENCE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`border-b-2 px-2 py-2 font-display text-[16px] font-medium transition ${
                isActive(item.href) ? 'border-white text-white' : 'border-transparent text-white/75 hover:text-white'
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="rounded-sm p-2 hover:bg-peat-light lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-peat-light bg-peat lg:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-2">
            {STEPS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-2 rounded-sm px-3 py-3 font-display text-[18px] font-semibold text-white/90 hover:bg-peat-light"
              >
                <span className="text-[13px] font-medium text-white/60">{item.step}</span>
                {t(item.key)}
              </Link>
            ))}
            <div className="my-1 border-t border-white/15" />
            {REFERENCE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-2.5 font-display text-[17px] font-medium text-white/85 hover:bg-peat-light"
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
