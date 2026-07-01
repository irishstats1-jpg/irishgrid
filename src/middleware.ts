import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  // 'as-needed' keeps English URLs clean (/curtailment) and prefixes Irish (/ga/curtailment).
  localePrefix: 'as-needed',
});

export const config = {
  // Match everything except api, static assets, widgets, admin and files.
  matcher: ['/((?!api|_next|_vercel|widget|admin|.*\\..*).*)'],
};
