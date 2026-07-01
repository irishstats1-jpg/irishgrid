import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Public pages are SEO-critical; App Router SSR/ISR is the default.
  // Cloudflare Pages deployment uses @cloudflare/next-on-pages (see README).
};

export default withNextIntl(nextConfig);
