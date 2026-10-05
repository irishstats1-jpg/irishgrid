'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Wordmark } from './Wordmark';
import { LanguageToggle } from './LanguageToggle';

// The header tells one story in three steps: the problem (clean energy we throw
// away and pay for), the tool (what the Bitcoin network actually is), and the
// solution (using that tool to fix the problem). Everything else is in the footer.
const NAV = [
  { href: '/', key: 'home', step: '01' },
  { href: '/bitcoin', key: 'bitcoin', step: '02' },
  { href: '/proposal', key: 'proposal', step: '03' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const tb = useTranslations('brand');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-peat text-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label={`${tb('name')} — home`}>
          <Wordmark tone="dark" markClassName="h-8 w-8" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-baseline gap-1.5 border-b-2 px-3 py-2 font-display text-[17px] font-semibold tracking-[0.02em] transition ${
                  active ? 'border-white text-white' : 'border-transparent text-white/80 hover:text-white'
                }`}
              >
                <span className="text-[12px] font-medium text-white/60">{item.step}</span>
                {t(item.key)}
              </Link>
            );
          })}
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
            {NAV.map((item) => (
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
          </div>
        </nav>
      )}
    </header>
  );
}
