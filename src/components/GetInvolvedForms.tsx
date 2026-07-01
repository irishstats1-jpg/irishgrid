'use client';

import { useState } from 'react';

type Pathway = 'policymaker' | 'investor' | 'pilot' | 'volunteer';

const PATHWAYS: Array<{ key: Pathway; title: string; blurb: string }> = [
  { key: 'policymaker', title: 'Policymaker briefing', blurb: 'Request a briefing or the evidence base for the case.' },
  { key: 'investor', title: 'Investor / partner', blurb: 'Request access to the data room and deck.' },
  { key: 'pilot', title: 'Host a pilot site', blurb: 'Renewable operators / landowners with surplus or curtailment.' },
  { key: 'volunteer', title: 'Volunteer', blurb: 'Join the campaign as a supporter.' },
];

const FIELDS: Record<Pathway, Array<{ name: string; label: string; type?: string; required?: boolean; textarea?: boolean }>> = {
  policymaker: [
    { name: 'name', label: 'Name', required: true },
    { name: 'org', label: 'Organisation / department' },
    { name: 'role', label: 'Role' },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'ask', label: 'What would you like from us?', textarea: true },
  ],
  investor: [
    { name: 'name', label: 'Name', required: true },
    { name: 'org', label: 'Firm / organisation' },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'ticket', label: 'Indicative ticket size (optional)' },
    { name: 'ask', label: 'What are you looking to explore?', textarea: true },
  ],
  pilot: [
    { name: 'name', label: 'Name', required: true },
    { name: 'org', label: 'Company / farm' },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'site', label: 'Site location (county)' },
    { name: 'capacity', label: 'Approx. capacity (MW) / curtailment seen' },
    { name: 'ask', label: 'Tell us about the site', textarea: true },
  ],
  volunteer: [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'skills', label: 'How would you like to help?', textarea: true },
  ],
};

export function GetInvolvedForms() {
  const [active, setActive] = useState<Pathway>('policymaker');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: active, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setStatus('done');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <nav className="space-y-2" aria-label="Pathways">
        {PATHWAYS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setActive(p.key);
              setStatus('idle');
            }}
            className={`w-full rounded-lg border p-3 text-left transition ${
              active === p.key ? 'border-sky-500 bg-sky-50' : 'border-navy-100 hover:bg-navy-50'
            }`}
          >
            <p className="font-semibold text-navy-900">{p.title}</p>
            <p className="text-xs text-navy-600">{p.blurb}</p>
          </button>
        ))}
      </nav>

      <div className="card">
        {status === 'done' ? (
          <div className="py-8 text-center">
            <p className="text-2xl">✅</p>
            <h3 className="mt-2 text-lg font-bold text-navy-900">Thank you</h3>
            <p className="prose-body mt-1">
              We&apos;ve received your submission and sent a confirmation. We&apos;ll be in touch.
            </p>
            <button type="button" className="btn-outline mt-4" onClick={() => setStatus('idle')}>
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-navy-900">{PATHWAYS.find((p) => p.key === active)!.title}</h3>
            {active === 'investor' && (
              <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-navy-800">
                On submission we&apos;ll email you access to the investor data room and deck.
              </p>
            )}
            {FIELDS[active].map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-navy-800">
                  {f.label} {f.required && <span className="text-orange-600">*</span>}
                </label>
                {f.textarea ? (
                  <textarea id={f.name} name={f.name} rows={4} required={f.required} className="w-full rounded-lg border border-navy-200 p-2.5 text-sm" />
                ) : (
                  <input id={f.name} name={f.name} type={f.type ?? 'text'} required={f.required} className="w-full rounded-lg border border-navy-200 p-2.5 text-sm" />
                )}
              </div>
            ))}
            <p className="text-xs text-navy-500">
              We store only what you submit, to respond to your enquiry. See our privacy note in the footer.
            </p>
            {status === 'error' && <p className="text-sm text-orange-700">{error}</p>}
            <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
