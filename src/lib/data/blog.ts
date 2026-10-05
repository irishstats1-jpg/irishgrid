// Blog content source (§5.6, §10). Reads from Supabase when configured;
// otherwise serves in-repo seed posts so the blog renders end-to-end. The admin
// CMS (AI drafting, scheduling, translations) writes to the same Supabase table.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // plain paragraphs separated by blank lines
  author: string;
  publishedAt: string;
  status: 'published' | 'draft';
  sources?: Array<{ title: string; url: string }>;
}

const REPORT_2024 = {
  title: 'EirGrid & SONI, Annual Renewable Energy Constraint and Curtailment Report 2024 (April 2025)',
  url: 'https://cms.eirgrid.ie/sites/default/files/publications/Annual-Renewable-Constraint-and-Curtailment-Report-2024-V1.0.pdf',
};
const REPORT_2020 = {
  title: 'EirGrid & SONI, Annual Renewable Energy Constraint and Curtailment Report 2020 (May 2021)',
  url: 'https://cms.eirgrid.ie/sites/default/files/publications/Annual-Renewable-Constraint-and-Curtailment-Report-2020.pdf',
};

/** Old slugs that should redirect to a post's current slug. */
export const POST_ALIASES: Record<string, string> = {
  'ireland-wasted-a-record-amount-of-wind-in-2024': 'ireland-turned-away-1266-gwh-of-wind-in-2024',
};

const SEED_POSTS: BlogPost[] = [
  {
    slug: 'ireland-turned-away-1266-gwh-of-wind-in-2024',
    title: 'Ireland turned away 1,266 GWh of wind power in 2024',
    excerpt:
      'One in ten units of wind energy available in Ireland in 2024 was dispatched down — the most since 2020. Across the whole island the share was 14%.',
    author: 'Irish Grid',
    publishedAt: '2026-10-05',
    status: 'published',
    sources: [REPORT_2024, REPORT_2020],
    body: `In 2024 the grid operator dispatched down 1,266 GWh of wind energy in Ireland: 10.1% of the wind energy that was available. That is up from 988 GWh (8.3%) in 2022 and 1,124 GWh (8.9%) in 2023, and the most since 2020, when Covid-19 lockdowns cut demand and 1,448 GWh (11.4%) was dispatched down.

Across the whole island, including Northern Ireland, the share rose faster: from 8.5% in 2022 to 10.7% in 2023 and 14.0% in 2024.

Dispatch-down happens for two reasons. Curtailment is system-wide: there is more wind and solar than the island can safely run on at once. Constraint is local: the network in one area cannot carry the power to where it is needed. The 2024 report says dispatch-down in Ireland was roughly equally due to each.

The two have different consequences. When a constraint turns a wind farm down, another generator — often gas — is turned up elsewhere to meet demand, and constrained generators with firm access are generally compensated. Curtailed power could not have been used at all, and for newer generators it is largely unpaid. Either way, the costs that are paid are recovered from electricity customers.

The share turned away tends to grow as more wind connects, unless the grid, storage and flexible demand keep pace. That is the problem this site is about.`,
  },
  {
    slug: 'what-is-dispatch-down',
    title: 'Curtailment and constraint: a plain-English guide to dispatch-down',
    excerpt: 'The two ways Ireland turns away clean power — and why they are paid for differently.',
    author: 'Irish Grid',
    publishedAt: '2026-10-05',
    status: 'published',
    sources: [REPORT_2024],
    body: `“Dispatch-down” is the umbrella term for any time the grid operator tells a generator to produce less than it could.

Curtailment is the system-wide kind. When there is more wind and solar than the whole island can safely absorb — limited by system stability rules — some of it is turned down. For many newer generators, curtailment is not compensated.

Constraint is the local kind. When the wires in one region cannot carry the power, generators there are turned down, and another generator elsewhere is turned up. Generators with firm grid access are generally compensated for constraint.

That distinction matters for cost. It is why this site keeps the volume turned away (which is reported) separate from the cost (which is modelled, as a range), rather than multiplying one large number by one price.`,
  },
  {
    slug: 'flexible-load-buyer-of-last-resort',
    title: 'A buyer of last resort: how flexible demand could use surplus power',
    excerpt: 'Demand that runs only on surplus, and stops on instruction, could use power that is now turned away — if the economics and the rules work.',
    author: 'Irish Grid',
    publishedAt: '2026-10-05',
    status: 'published',
    body: `Imagine a customer that only buys electricity the grid would otherwise turn away, and stops within seconds whenever anyone else needs it.

That is the role a flexible, interruptible load could play. By paying for power that is now dispatched down, it gives wind farms revenue for energy they currently lose, which makes new projects easier to finance.

Provided it runs only on surplus and stops on instruction, it adds no demand for fossil power and takes no supply from homes or businesses. Making that a condition of connection is one of the policy options on this site.

Batteries, electrolysers and moving existing demand can all play this role. Bitcoin mining is unusual because it can be sited anywhere with a power and internet connection, built in months, and switched off in seconds. Whether it pays is a separate question: a fleet that runs only on surplus sits idle much of the year, and under our central assumptions it does not cover its costs at today's price. The policy option page shows the numbers and lets you change the assumptions.`,
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
