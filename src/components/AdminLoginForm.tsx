'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Posts to /api/admin/login. With JavaScript it uses fetch; without it the
// browser sends a normal POST, so credentials never appear in a URL.
export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Sign-in failed');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setSubmitting(false);
    }
  }

  return (
    <form method="post" action="/api/admin/login" onSubmit={onSubmit} className="mt-6 space-y-4 rounded-sm border border-ink-200 bg-white p-6">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-800">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="min-h-[44px] w-full rounded-sm border border-ink-300 p-2.5 text-sm" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-800">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="min-h-[44px] w-full rounded-sm border border-ink-300 p-2.5 text-sm" />
      </div>
      {error && <p className="border-l-2 border-ink pl-2 text-sm font-medium text-ink" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
