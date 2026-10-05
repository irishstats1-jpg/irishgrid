import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPost, getPosts, POST_ALIASES } from '@/lib/data/blog';
import { INDEPENDENCE_LINE } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not found' };
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, type: 'article' } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (POST_ALIASES[slug]) permanentRedirect(`${locale === 'en' ? '' : `/${locale}`}/blog/${POST_ALIASES[slug]}`);
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-12">
      <Link href="/blog" className="text-sm font-medium text-green-700">← All posts</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {new Date(post.publishedAt).toLocaleDateString('en-IE', { dateStyle: 'long', timeZone: 'UTC' })} · {post.author}
      </p>
      <div className="prose-body mt-6 space-y-4">
        {post.body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {post.sources && post.sources.length > 0 && (
        <div className="mt-8 border-t border-ink-200 pt-4">
          <h2 className="eyebrow">Sources</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link">{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-10 rounded-sm border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700">
        Volumes are reported by EirGrid and SONI; costs are modelled (see the method page). Not financial advice.{' '}
        {INDEPENDENCE_LINE}
      </p>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
