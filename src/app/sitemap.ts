import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getPosts } from '@/lib/data/blog';

const ROUTES = ['', '/bitcoin', '/proposal', '/get-involved', '/blog', '/about', '/press', '/pledge', '/data', '/privacy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://irishgrid.com';
  const posts = await getPosts();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const prefix = locale === 'en' ? '' : `/${locale}`;
    for (const route of ROUTES) {
      entries.push({ url: `${base}${prefix}${route}`, changeFrequency: 'daily', priority: route === '' ? 1 : 0.7 });
    }
    for (const p of posts) {
      entries.push({ url: `${base}${prefix}/blog/${p.slug}`, changeFrequency: 'weekly', priority: 0.5 });
    }
  }
  return entries;
}
