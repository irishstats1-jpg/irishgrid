import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section } from '@/components/ui';
import { getPosts } from '@/lib/data/blog';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Blog',
  description: 'Analysis and explainers on Ireland’s grid, curtailment, and the case for flexible mining load.',
};

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = await getPosts();
  return (
    <>
      <PageHeader eyebrow="Blog" title="Analysis & explainers" intro="Plain-English writing on Ireland’s grid, curtailment and flexible demand." />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card block transition hover:shadow-md">
              <p className="text-xs text-navy-500">{new Date(p.publishedAt).toLocaleDateString('en-IE', { dateStyle: 'medium' })} · {p.author}</p>
              <h2 className="mt-2 text-lg font-bold text-navy-900">{p.title}</h2>
              <p className="prose-body mt-2 line-clamp-3">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-medium text-sky-600">Read →</span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
