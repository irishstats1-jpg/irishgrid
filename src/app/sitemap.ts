import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/data/blog';
import { BRIEFS } from '@/lib/briefs';
import { SITE_URL } from '@/lib/site';

// English pages only: the Irish-language pages are noindex until their content is translated.
const ROUTES = ['', '/bitcoin', '/proposal', '/briefs', '/data', '/methodology', '/get-involved', '/blog', '/about', '/press', '/pledge', '/privacy', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    ...ROUTES.map((route) => ({
      url: `${SITE_URL}${route}`,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.7,
    })),
    ...BRIEFS.map((b) => ({ url: `${SITE_URL}/briefs/${b.slug}`, lastModified: b.published, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.publishedAt, priority: 0.5 })),
  ];
}
