'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center rounded-md border border-navy-600 text-xs" role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale ? 'true' : undefined}
          className={`px-2.5 py-1.5 font-semibold uppercase transition ${
            l === locale ? 'bg-sky-500 text-white' : 'text-navy-50 hover:bg-navy-600'
          }`}
          title={localeNames[l]}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
