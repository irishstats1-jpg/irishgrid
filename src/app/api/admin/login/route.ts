import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAllowedAdmin } from '@/lib/adminAuth';
import { isRateLimited } from '@/lib/rateLimit';
import { readBody } from '@/lib/validation';

// Sign in an allowlisted admin via Supabase Auth's password grant and keep the
// access token in an httpOnly cookie. Accepts JSON or a plain form post, so a
// password is never sent in a URL even before JavaScript loads.
export async function POST(request: Request) {
  const { body, isForm } = await readBody(request);
  const fail = (error: string, http: number) =>
    isForm
      ? NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(error)}`, request.url), 303)
      : NextResponse.json({ error }, { status: http });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fail('Sign-in is not configured', 503);
  if (await isRateLimited(request, 'admin-login')) return fail('Too many attempts. Wait a minute and try again.', 429);

  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return fail('Email and password are required', 400);

  let data: { access_token?: string; expires_in?: number; user?: { email?: string } } = {};
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ email, password }),
    });
    data = await res.json();
    if (!res.ok || !data.access_token) return fail('Invalid credentials', 401);
  } catch {
    return fail('Sign-in failed', 502);
  }
  if (!isAllowedAdmin(data.user?.email)) return fail('This account is not an administrator', 403);

  const response = isForm
    ? NextResponse.redirect(new URL('/admin', request.url), 303)
    : NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: data.expires_in ?? 3600,
  });
  return response;
}
