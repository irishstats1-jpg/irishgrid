// Blog content source (§5.6, §10). Reads from Supabase when configured;
// otherwise serves in-repo seed posts so the blog renders end-to-end. The admin
// CMS (AI drafting, scheduling, translations) writes to the same Supabase table.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // markdown-ish; rendered as paragraphs
  author: string;
  publishedAt: string;
  status: 'published' | 'draft';
}

const SEED_POSTS: BlogPost[] = [
  {
    slug: 'ireland-wasted-a-record-amount-of-wind-in-2024',
    title: 'Ireland wasted a record amount of wind in 2024 — here’s what it cost',
    excerpt:
      'Across the island, wind dispatch-down hit 14% in 2024 — with 1,266 GWh thrown away in the Republic alone. We break down why, and what it means for bills.',
    author: 'Irish Grid',
    publishedAt: '2025-02-10',
    status: 'published',
    body: `In 2024, the share of available wind energy dispatched down across the island of Ireland reached 14.0% — up from 10.7% in 2023 and 8.5% in 2022. In the Republic alone, 1,266 GWh of wind was thrown away.

Dispatch-down happens for two reasons. Curtailment is system-wide: there is more renewable generation than the grid can safely carry at once, bounded by the System Non-Synchronous Penetration (SNSP) limit. Constraint is local: the transmission network in a given area cannot move the power to where it is needed.

Either way, the result is the same — clean electricity that was generated but never used, replaced by burning gas. That pushes up both wholesale prices and emissions, and the cost lands on billpayers.

The uncomfortable truth is that this problem grows with success: the more wind we build, the more we curtail, unless the grid, storage and flexible demand keep pace.`,
  },
  {
    slug: 'what-is-dispatch-down',
    title: 'Curtailment vs constraint: a plain-English guide to dispatch-down',
    excerpt: 'The two ways Ireland throws away clean energy — and why they’re paid for differently.',
    author: 'Irish Grid',
    publishedAt: '2025-03-04',
    status: 'published',
    body: `“Dispatch-down” is the umbrella term for any time a generator is told to produce less than it could.

Curtailment is the system-wide kind. When there’s too much non-synchronous generation (mostly wind) for the whole island to absorb safely, some of it is dialled back. For many newer generators this curtailment is uncompensated.

Constraint is the local kind. When the wires in one region can’t carry the power, generators there are constrained off — and this is generally compensated.

That distinction matters for cost. It’s why we separate the wasted volume from the compensated cost, rather than multiplying one big number by a price.`,
  },
  {
    slug: 'flexible-load-buyer-of-last-resort',
    title: 'A buyer of last resort: how flexible load turns waste into value',
    excerpt: 'Interruptible demand that only runs on surplus can improve renewable economics without competing with consumers.',
    author: 'Irish Grid',
    publishedAt: '2025-04-18',
    status: 'published',
    body: `Imagine a customer who only ever buys electricity that would otherwise be thrown away, and who switches off within seconds the moment anyone else needs it.

That’s the role a flexible, interruptible load can play. By paying for otherwise-curtailed output, it gives wind and solar projects revenue for energy they’d otherwise waste — improving their economics and helping more renewables get built.

Because it consumes only surplus and never competes with homes or industry, it adds no new fossil demand. It’s a buyer of last resort — and Bitcoin mining is one of the few loads that can be sited anywhere, scaled modularly, and interrupted instantly.`,
  },
];

async function fromSupabase(slug?: string): Promise<BlogPost[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const q = slug
      ? `slug=eq.${encodeURIComponent(slug)}`
      : 'status=eq.published&order=published_at.desc';
    const res = await fetch(`${url}/rest/v1/blog_posts?${q}&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as BlogPost[];
  } catch {
    return null;
  }
}

export async function getPosts(): Promise<BlogPost[]> {
  const remote = await fromSupabase();
  if (remote && remote.length) return remote;
  return SEED_POSTS.filter((p) => p.status === 'published');
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const remote = await fromSupabase(slug);
  if (remote && remote.length) return remote[0];
  return SEED_POSTS.find((p) => p.slug === slug);
}
