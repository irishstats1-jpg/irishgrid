'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { HONEYPOT_FIELD } from '@/lib/validation';

export type Pathway = 'policymaker' | 'pilot' | 'volunteer';

const PATHWAYS: Array<{ key: Pathway; title: string; blurb: string }> = [
  { key: 'policymaker', title: 'Request a briefing', blurb: 'For TDs, Senators, officials, researchers and advisers.' },
  { key: 'pilot', title: 'Host or partner on a pilot', blurb: 'Renewable operators, landowners and flexible-load operators at constrained sites.' },
  { key: 'volunteer', title: 'Support the work', blurb: 'Help with research, translation or outreach.' },
];

const FIELDS: Record<Pathway, Array<{ name: string; label: string; type?: string; required?: boolean; textarea?: boolean; max: number }>> = {
  policymaker: [
    { name: 'name', label: 'Name', required: true, max: 120 },
    { name: 'org', label: 'Office, department or organisation', max: 160 },
    { name: 'role', label: 'Role', max: 160 },
    { name: 'email', label: 'Email', type: 'email', required: true, max: 254 },
    { name: 'ask', label: 'What would be useful to you?', textarea: true, max: 2000 },
  ],
  pilot: [
    { name: 'name', label: 'Name', required: true, max: 120 },
    { name: 'org', label: 'Company or organisation', max: 160 },
    { name: 'email', label: 'Email', type: 'email', required: true, max: 254 },
    { name: 'site', label: 'Site location (county)', max: 160 },
    { name: 'capacity', label: 'Approximate capacity (MW) and dispatch-down seen', max: 160 },
    { name: 'ask', label: 'Tell us about the site', textarea: true, max: 2000 },
  ],
  volunteer: [
    { name: 'name', label: 'Name', required: true, max: 120 },
    { name: 'email', label: 'Email', type: 'email', required: true, max: 254 },
    { name: 'skills', label: 'How would you like to help?', textarea: true, max: 2000 },
  ],
};

const STATUS_COPY: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: 'Thank you — we’ve received your message and will reply soon.' },
  unavailable: { ok: false, text: 'We couldn’t send your message just now. Please try again later.' },
  busy: { ok: false, text: 'Too many attempts from your connection. Please wait a minute and try again.' },
  error: { ok: false, text: 'Something was missing. Please check the form and try again.' },
};

export function GetInvolvedForms({ initialPathway = 'policymaker', initialStatus }: { initialPathway?: Pathway; initialStatus?: string }) {
  const [active, setActive] = useState<Pathway>(initialPathway);
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    const form = e.currentTarget;
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const json = (await res.json()) as { status?: string; error?: string };
      setStatus(json.status ?? (res.ok ? 'ok' : 'unavailable'));
      if (json.error) setMessage(json.error);
      if (res.ok) form.reset();
    } catch {
      setStatus('unavailable');
    } finally {
      setSubmitting(false);
    }
  }

  const copy = status ? STATUS_COPY[status] : undefined;

  return (
    <div id="forms" className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <nav className="space-y-2" aria-label="Ways to get involved">
        {PATHWAYS.map((p) => (
          <a
            key={p.key}
            href={`?pathway=${p.key}#forms`}
            aria-current={active === p.key ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              setActive(p.key);
              setStatus(undefined);
            }}
            className={`block rounded-sm border p-3 transition ${
              active === p.key ? 'border-green-500 bg-green-100' : 'border-ink-200 bg-white hover:bg-ink-100'
            }`}
          >
            <span className="block font-display text-[18px] font-semibold text-ink">{p.title}</span>
            <span className="block text-sm text-ink-600">{p.blurb}</span>
          </a>
        ))}
      </nav>

      <div className="card" aria-live="polite">
        {copy && (
          <p className={`mb-5 border-l-2 pl-3 text-sm font-medium text-ink ${copy.ok ? 'border-green-500' : 'border-ink'}`}>
            {message || copy.text}
          </p>
        )}
        <form method="post" action="/api/submissions" onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-[22px]">{PATHWAYS.find((p) => p.key === active)!.title}</h2>
          <input type="hidden" name="type" value={active} />
          {FIELDS[active].map((f) => (
            <div key={`${active}-${f.name}`}>
              <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-ink-800">
                {f.label} {f.required && <span className="text-green-700">*</span>}
              </label>
              {f.textarea ? (
                <textarea id={f.name} name={f.name} rows={4} maxLength={f.max} required={f.required} className="w-full rounded-sm border border-ink-300 bg-white p-2.5 text-[15px]" />
              ) : (
                <input id={f.name} name={f.name} type={f.type ?? 'text'} maxLength={f.max} required={f.required} className="min-h-[44px] w-full rounded-sm border border-ink-300 bg-white p-2.5 text-[15px]" />
              )}
            </div>
          ))}
          <div className="hidden" aria-hidden>
            <label htmlFor={HONEYPOT_FIELD}>Leave this empty</label>
            <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
          </div>
          <p className="text-xs leading-relaxed text-ink-600">
            We store only what you send, to reply to you, and keep it for up to 24 months. See the{' '}
            <Link href="/privacy" className="link">privacy notice</Link>.
          </p>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
