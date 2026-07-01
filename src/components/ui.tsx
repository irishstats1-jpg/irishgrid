import type { ReactNode } from 'react';

export function EstimateBadge({ label = 'Modelled estimate' }: { label?: string }) {
  return (
    <span className="badge-estimate" title="Modelled from live data — not an official actual.">
      <span aria-hidden>≈</span> {label}
    </span>
  );
}

export function ActualBadge({ label = 'Official actual' }: { label?: string }) {
  return (
    <span className="badge-actual" title="From official EirGrid Constraint & Curtailment reports.">
      <span aria-hidden>✓</span> {label}
    </span>
  );
}

export function NotFinancialAdvice() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <strong>Not financial or investment advice.</strong> Bitcoin figures depend on volatile
      market prices and network conditions and are illustrative only.
    </p>
  );
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'proposal';
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-navy-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    proposal: 'border-navy-200 bg-navy-50 text-navy-800',
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
}) {
  return (
    <div className="border-b border-navy-100 bg-navy-50">
      <div className="container-page py-10 md:py-14">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          {title}
        </h1>
        {intro && <div className="prose-body mt-4 max-w-3xl">{intro}</div>}
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`container-page py-10 ${className}`}>
      {title && <h2 className="mb-5 text-2xl font-bold text-navy-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Takeaway({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 border-l-2 border-sky-400 pl-3 text-sm italic text-navy-700">
      {children}
    </p>
  );
}
