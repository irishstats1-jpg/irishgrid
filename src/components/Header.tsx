'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Wordmark } from './Wordmark';
import { LanguageToggle } from './LanguageToggle';

// The header tells the story in three steps: the problem (Cost), what it costs
// us (Curtailment payments), and the solution (Proposal). Everything else lives
// in the footer.
const NAV = [
  { href: '/', key: 'home' },
  { href: '/curtailment', key: 'curtailment' },
  { href: '/proposal', key: 'proposal' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-navy-700 text-white shadow-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Irish Grid home">
          <Wordmark className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-navy-600 ${
                  active ? 'bg-navy-600 text-white' : 'text-navy-50'
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="rounded-md p-2 hover:bg-navy-600 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-navy-600 bg-navy-700 lg:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-navy-50 hover:bg-navy-600"
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
