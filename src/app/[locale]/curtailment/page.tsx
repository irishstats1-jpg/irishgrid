import { redirect } from 'next/navigation';

// The curtailment / cost story is now merged into Step 1 (The Problem) on the
// home page. Keep this route alive so old links and shares don't 404 — send
// visitors to the combined page. Locale comes from params so we avoid reading
// request headers (which would force dynamic rendering).
export default async function CurtailmentRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(locale === 'en' ? '/' : `/${locale}`);
}
