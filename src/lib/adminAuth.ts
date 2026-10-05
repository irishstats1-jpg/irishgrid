import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Admin auth for /admin via Supabase Auth (REST, no SDK). A valid Supabase
// session is not enough: the account's email must also be in ADMIN_EMAILS.
// In production every check fails closed — missing configuration denies access.

export const ADMIN_COOKIE = 'ig_admin_session';
const isProduction = process.env.NODE_ENV === 'production';

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True when `email` may administer the site. With no allowlist set, only dev allows. */
export function isAllowedAdmin(email: string | undefined): boolean {
  const allow = adminEmails();
  if (allow.length === 0) return !isProduction;
  return Boolean(email && allow.includes(email.toLowerCase()));
}

export async function getAdminUser(): Promise<{ email?: string } | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { email?: string };
    return isAllowedAdmin(user.email) ? user : null;
  } catch {
    return null;
  }
}

/**
 * Guard for admin pages. Unconfigured auth is only tolerated in local
 * development (with a banner); in production it redirects to the login page.
 */
export async function requireAdmin(): Promise<{ configured: boolean; email?: string }> {
  if (!supabaseConfigured()) {
    if (isProduction) redirect('/admin/login?error=Sign-in%20is%20not%20configured');
    return { configured: false };
  }
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return { configured: true, email: user.email };
}
