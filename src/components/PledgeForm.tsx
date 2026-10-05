'use client';

import { useState } from 'react';

export function PledgeForm({ initialCount }: { initialCount: number }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setCount((c) => c + 1);
      setStatus('done');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-sm bg-peat p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-300">Pledge tally</p>
        <p className="mt-2 text-5xl font-semibold">{count.toLocaleString('en-IE')}</p>
        <p className="mt-1 text-white/90">people have pledged their support so far.</p>
        <p className="mt-6 text-sm text-white/75">
          &ldquo;I support ending the waste of Ireland&apos;s clean energy, and exploring flexible demand —
          including interruptible Bitcoin mining — to soak up curtailment, stabilise the grid and keep bills
          down.&rdquo;
        </p>
      </div>

      <div className="card">
        {status === 'done' ? (
          <div className="py-8 text-center">
            <p className="text-2xl">✅</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">You&apos;re signed up</h3>
            <p className="prose-body mt-1">Thank you for adding your name. We&apos;ve emailed a confirmation.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-ink">Add your name</h3>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink-800">Name <span className="text-green-700">*</span></label>
              <input id="name" name="name" required className="w-full rounded-sm border border-ink-200 p-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor="org" className="mb-1 block text-sm font-medium text-ink-800">Organisation (optional)</label>
              <input id="org" name="org" className="w-full rounded-sm border border-ink-200 p-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-800">Email <span className="text-green-700">*</span></label>
              <input id="email" name="email" type="email" required className="w-full rounded-sm border border-ink-200 p-2.5 text-sm" />
            </div>
            <p className="text-xs text-ink-500">We store your name, optional organisation and email to count and confirm your pledge.</p>
            {status === 'error' && <p className="border-l-2 border-ink pl-2 text-sm font-medium text-ink">{error}</p>}
            <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Signing…' : 'Sign the pledge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
