'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { HONEYPOT_FIELD } from '@/lib/validation';

export const PLEDGE_STATEMENT =
  'I support ending the waste of Ireland’s clean power, and I ask decision-makers to let flexible demand use surplus renewable electricity at constrained sites — without subsidy, and switching off whenever homes need the power.';

const STATUS_COPY: Record<string, { tone: 'ok' | 'error'; title: string; body: string }> = {
  pending: { tone: 'ok', title: 'Check your inbox', body: 'We’ve sent you a link. Your pledge is counted once you confirm it.' },
  stored: { tone: 'ok', title: 'Thank you', body: 'Your pledge has been recorded.' },
  confirmed: { tone: 'ok', title: 'Pledge confirmed', body: 'Thank you — your pledge now counts towards the total.' },
  withdrawn: { tone: 'ok', title: 'Pledge withdrawn', body: 'Your pledge and your details have been deleted.' },
  duplicate: { tone: 'ok', title: 'Already signed', body: 'This email address has already signed the pledge.' },
  invalid: { tone: 'error', title: 'That link didn’t work', body: 'It may have been used already or have expired.' },
  unavailable: { tone: 'error', title: 'Not recorded', body: 'We couldn’t record your pledge just now. Please try again later.' },
  busy: { tone: 'error', title: 'Too many attempts', body: 'Please wait a minute and try again.' },
  error: { tone: 'error', title: 'Something was missing', body: 'Please check the form and try again.' },
};

export function PledgeForm({ count, initialStatus }: { count: number | null; initialStatus?: string }) {
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    const form = e.currentTarget;
    try {
      const res = await fetch('/api/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const json = (await res.json()) as { status?: string; error?: string };
      setStatus(json.status ?? (res.ok ? 'stored' : 'unavailable'));
      if (json.error) setMessage(json.error);
      if (res.ok) form.reset();
    } catch {
      setStatus('unavailable');
    } finally {
      setSubmitting(false);
    }
  }

  const copy = status ? STATUS_COPY[status] : undefined;
  const done = copy?.tone === 'ok';

  return (
    <div id="pledge-form" className="grid gap-6 md:grid-cols-2">
      <div className="rounded-sm bg-peat p-8 text-white">
        <p className="eyebrow !text-green-300">The pledge</p>
        <blockquote className="mt-3 font-display text-[24px] font-medium leading-snug">“{PLEDGE_STATEMENT}”</blockquote>
        {count !== null && count > 0 && (
          <p className="mt-6 text-white/85">
            <span className="figure text-[40px] text-white">{count.toLocaleString('en-IE')}</span>{' '}
            {count === 1 ? 'person has' : 'people have'} confirmed their pledge.
          </p>
        )}
        <p className="mt-6 text-sm text-white/75">
          Names are not published. We use the confirmed total when we write to decision-makers.
        </p>
      </div>

      <div className="card" aria-live="polite">
        {copy && (
          <div className={`mb-5 border-l-2 pl-3 ${copy.tone === 'ok' ? 'border-green-500' : 'border-ink'}`}>
            <p className="font-display text-[20px] font-semibold text-ink">{copy.title}</p>
            <p className="text-sm text-ink-700">{message || copy.body}</p>
          </div>
        )}
        {!done && (
          <form method="post" action="/api/pledge" onSubmit={onSubmit} className="space-y-4">
            <h2 className="text-[22px]">Add your name</h2>
            <Field id="name" label="Name" required maxLength={120} />
            <Field id="org" label="Organisation (optional)" maxLength={160} />
            <Field id="email" label="Email" type="email" required maxLength={254} />
            <div className="hidden" aria-hidden>
              <label htmlFor={HONEYPOT_FIELD}>Leave this empty</label>
              <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
            </div>
            <p className="text-xs leading-relaxed text-ink-600">
              We store your name, optional organisation and email to confirm and count your pledge, and send you one
              confirmation email. You can withdraw at any time. See the{' '}
              <Link href="/privacy" className="link">privacy notice</Link>.
            </p>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Sign the pledge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = 'text',
  required = false,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  maxLength: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-800">
        {label} {required && <span className="text-green-700">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        maxLength={maxLength}
        className="min-h-[44px] w-full rounded-sm border border-ink-300 bg-white p-2.5 text-[15px]"
      />
    </div>
  );
}
