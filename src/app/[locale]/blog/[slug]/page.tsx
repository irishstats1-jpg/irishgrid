import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPost, getPosts } from '@/lib/data/blog';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Not found' };
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, type: 'article' } };
}

export default async function BlogPostPage({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  setRequestLocale(locale);
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-12">
      <Link href="/blog" className="text-sm font-medium text-sky-600">← All posts</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-navy-500">
        {new Date(post.publishedAt).toLocaleDateString('en-IE', { dateStyle: 'long' })} · {post.author}
      </p>
      <div className="prose-body mt-6 space-y-4">
        {post.body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Figures referenced are modelled estimates unless stated. Not financial advice. Irish Grid is independent and not affiliated with EirGrid or SONI.
      </p>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
