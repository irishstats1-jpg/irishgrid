import 'server-only';

/**
 * Server-side translation lookup via direct JSON import.
 *
 * next-intl's `getMessages()` / `getTranslations()` trip a WeakMap error during
 * static prerender in this Next 14.2 / next-intl 3.17 combination, so server
 * components read messages directly. Client components continue to use
 * `useTranslations` through NextIntlClientProvider as normal.
 */
export async function getT(locale: string) {
  const messages = (await import(`../../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;
  return function t(path: string): string {
    const value = path
      .split('.')
      .reduce<unknown>((obj, key) => (obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined), messages);
    return typeof value === 'string' ? value : path;
  };
}
