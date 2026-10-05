import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

// 'as-needed' keeps English URLs clean (/methodology) and prefixes Irish (/ga/methodology).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
