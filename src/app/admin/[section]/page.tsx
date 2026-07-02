import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// Admin sub-sections (§10). These are functional seams: the dashboard, auth and
// data layer are in place; each section documents what it manages and where it
// reads/writes so the CRUD UI can be filled in against Supabase.
const SECTIONS: Record<string, { title: string; desc: string; io: string }> = {
  blog: {
    title: 'Blog CMS',
    desc: 'Rich editor with OpenAI "draft this post" / "improve", media library, preview, publish/schedule, per-post SEO, and trigger GA translation.',
    io: 'Reads/writes blog_posts + blog_post_translations (Supabase). Public blog already renders from this source.',
  },
  social: {
    title: 'Social oversight',
    desc: 'View auto-generated drafts and the schedule; edit caption templates; per-platform settings; manual override/pause. Publishing is hands-off via Make.',
    io: 'Reads social_posts; templates feed /api/social-summary + /api/social-card.',
  },
  translations: {
    title: 'Translations',
    desc: 'Run OpenAI GA translation per page/post and review key pages before publishing; mark reviewed.',
    io: 'Writes blog_post_translations; UI strings live in messages/*.json.',
  },
  submissions: {
    title: 'Submissions inbox',
    desc: 'Filter by type (policymaker/investor/pilot/volunteer); mark handled; CSV export.',
    io: 'Reads submissions (Supabase). Fed by /api/submissions.',
  },
  pledges: {
    title: 'Pledges',
    desc: 'List, count and export the pledge of support.',
    io: 'Reads pledges (Supabase). Fed by /api/pledge; tally shown on /pledge.',
  },
  press: {
    title: 'Press assets',
    desc: 'Upload and manage media-kit files shown on /press.',
    io: 'Reads/writes press_assets (Supabase).',
  },
  assumptions: {
    title: 'Assumptions & forecast config',
    desc: 'Edit mining defaults, cost parameters and the per-billpayer/per-person/household denominators — figures recompute without a redeploy.',
    io: 'Reads/writes assumptions + forecast_config. Defaults in src/lib/methodology/constants.ts.',
  },
  settings: {
    title: 'Settings',
    desc: 'Site config, disclaimers, and social/Make webhook configuration.',
    io: 'Reads/writes site settings + MAKE_SOCIAL_WEBHOOK_SECRET.',
  },
};

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin();
  const { section } = await params;
  const s = SECTIONS[section];
  if (!s) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">{s.title}</h1>
      <p className="text-navy-700">{s.desc}</p>
      <div className="rounded-lg border border-navy-100 bg-white p-4 text-sm text-navy-600">
        <p className="font-medium text-navy-900">Data</p>
        <p className="mt-1">{s.io}</p>
      </div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        The data model, APIs and public rendering for this section are in place; wire the CRUD UI to Supabase to complete it.
      </p>
    </div>
  );
}
