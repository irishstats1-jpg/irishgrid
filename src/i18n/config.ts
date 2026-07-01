// Internationalisation config (§12): English default, Irish (Gaeilge) toggle.
export const locales = ['en', 'ga'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ga: 'Gaeilge',
};
