'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Login failed');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-navy-900">Admin sign in</h1>
      <p className="mt-1 text-sm text-navy-600">Single-admin access via Supabase Auth.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-navy-100 bg-white p-6">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy-800">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded-lg border border-navy-200 p-2.5 text-sm" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy-800">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded-lg border border-navy-200 p-2.5 text-sm" />
        </div>
        {status === 'error' && <p className="text-sm text-orange-700">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
