import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Single-admin auth for /admin via Supabase Auth (§10), using the REST endpoints
// directly so no SDK dependency is needed. The access token is stored in an
// httpOnly cookie and verified against Supabase on each admin request.

export const ADMIN_COOKIE = 'ig_admin_session';

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getAdminUser(): Promise<{ email?: string } | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as { email?: string };
  } catch {
    return null;
  }
}

/**
 * Guard for admin pages. When Supabase is configured, an invalid/absent session
 * redirects to the login page. When it isn't (local dev before setup), access is
 * allowed and the dashboard shows a "configure auth" banner.
 */
export async function requireAdmin(): Promise<{ configured: boolean; email?: string }> {
  if (!supabaseConfigured()) return { configured: false };
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return { configured: true, email: user.email };
}
