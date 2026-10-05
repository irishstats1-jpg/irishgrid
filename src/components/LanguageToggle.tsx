'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center rounded-sm border border-white/30 font-display text-[13px]" role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale ? 'true' : undefined}
          className={`min-h-[32px] px-2.5 py-1 font-semibold uppercase tracking-[0.08em] transition ${
            l === locale ? 'bg-white text-peat' : 'text-white/85 hover:bg-peat-light'
          }`}
          title={localeNames[l]}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
