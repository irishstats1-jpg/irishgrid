import type { ReactNode } from 'react';

// ---- Basis tags (Brand Book §07: "No number without its basis") -------------
// Every figure carries a period tag; scope and method tags are added whenever
// two figures on a page differ in either. Bitcoin figures carry "† If mined".

export type TagKind = 'period' | 'scope' | 'method' | 'mined';
export interface TagSpec {
  kind: TagKind;
  label: string;
}

const TAG_STYLES: Record<TagKind, string> = {
  period: 'bg-green-100 text-green-700',
  scope: 'bg-ink-100 text-ink-600',
  method: 'border border-ink-700 text-ink-800',
  mined: 'bg-orange-200 text-orange-700',
};

export function BasisTag({ kind, children }: { kind: TagKind; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-[2px] px-2 py-0.5 text-[12px] font-medium leading-5 ${TAG_STYLES[kind]}`}>
      {children}
    </span>
  );
}

export function TagRow({ tags, className = '' }: { tags: TagSpec[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <BasisTag key={`${t.kind}-${t.label}`} kind={t.kind}>
          {t.label}
        </BasisTag>
      ))}
    </div>
  );
}

// ---- Frames ------------------------------------------------------------------

const CORNERS = [
  '-left-[6px] -top-[6px]',
  '-right-[6px] -top-[6px]',
  '-left-[6px] -bottom-[6px]',
  '-right-[6px] -bottom-[6px]',
] as const;

/** Registration crosshairs at the four corners — the brand book's frame. */
export function Framed({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative border border-ink-200 ${className}`}>
      {CORNERS.map((pos) => (
        <svg key={pos} className={`pointer-events-none absolute h-3 w-3 text-ink-400 ${pos}`} viewBox="0 0 12 12" aria-hidden>
          <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
      {children}
    </div>
  );
}

// ---- The paired figure (Brand Book §06) ----------------------------------------
// Every green number has an orange counterpart. They sit in one frame, green
// first, so the reader sees the cost before the alternative.

export interface FigureSide {
  label: string;
  value: string;
  gloss?: ReactNode;
  tags?: TagSpec[];
}

const FIGURE_SIZES = {
  lg: 'text-[64px] md:text-[96px]',
  md: 'text-[48px] md:text-[60px]',
  sm: 'text-[36px] md:text-[40px]',
} as const;

export function PairedFigure({
  green,
  orange,
  size = 'md',
  stacked = false,
  className = '',
}: {
  green: FigureSide;
  orange: FigureSide;
  size?: keyof typeof FIGURE_SIZES;
  /** Force one column (for narrow side panels). */
  stacked?: boolean;
  className?: string;
}) {
  return (
    <Framed className={`grid ${stacked ? '' : 'md:grid-cols-2'} ${className}`}>
      <FigureHalf side={green} tone="green" size={size} stacked={stacked} />
      <FigureHalf side={{ ...orange, label: `${orange.label}†` }} tone="orange" size={size} stacked={stacked} />
    </Framed>
  );
}

function FigureHalf({
  side,
  tone,
  size,
  stacked,
}: {
  side: FigureSide;
  tone: 'green' | 'orange';
  size: keyof typeof FIGURE_SIZES;
  stacked: boolean;
}) {
  const isGreen = tone === 'green';
  const divider = stacked ? 'border-t border-ink-200' : 'border-t border-ink-200 md:border-l md:border-t-0';
  return (
    <div className={`flex flex-col p-5 md:p-6 ${isGreen ? 'bg-white' : `bg-orange-100 ${divider}`}`}>
      <p className="eyebrow flex items-center gap-2 !text-ink-800">
        <span className={`inline-block h-3 w-3 shrink-0 ${isGreen ? 'bg-green-500' : 'bg-orange-500'}`} aria-hidden />
        {side.label}
      </p>
      <p className={`figure mt-3 ${FIGURE_SIZES[size]} ${isGreen ? 'text-green-700' : 'text-orange-700'}`}>{side.value}</p>
      {side.gloss && <p className="mt-2 text-[15px] text-ink-700">{side.gloss}</p>}
      {side.tags && <TagRow tags={side.tags} className="mt-auto pt-4" />}
    </div>
  );
}

/** A single green figure in the brand frame (for figures with no orange counterpart). */
export function SingleFigure({
  side,
  size = 'sm',
  className = '',
}: {
  side: FigureSide;
  size?: keyof typeof FIGURE_SIZES;
  className?: string;
}) {
  return (
    <Framed className={`grid ${className}`}>
      <FigureHalf side={side} tone="green" size={size} stacked />
    </Framed>
  );
}

/** One-line note required wherever two bases appear together (§07 rule 5). */
export function WhyDiffer({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[13px] text-ink-600">
      <span className="font-display font-semibold uppercase tracking-[0.08em] text-ink-800">Why these differ · </span>
      {children}
    </p>
  );
}

// ---- Disclaimers -----------------------------------------------------------------

/** The † Bitcoin disclaimer — wherever orange appears (evidence rule 4). */
export function NotFinancialAdvice({
  priceEur,
  asOf,
  live,
}: {
  priceEur?: number;
  /** Already-formatted date, e.g. "4 October 2026". */
  asOf?: string;
  /** False when the stored snapshot is in use because live data was unavailable. */
  live?: boolean;
}) {
  const price =
    priceEur !== undefined
      ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
          Math.round(priceEur / 100) * 100,
        )
      : undefined;
  return (
    <p className="border border-ink-200 bg-white px-3 py-2 text-xs leading-relaxed text-ink-700">
      <span className="font-display font-semibold uppercase tracking-[0.08em] text-orange-700">† Bitcoin figures · </span>
      Modelled gross revenue at the BTC price{price ? ` (${price})` : ''} and network hashrate
      {asOf ? ` on ${asOf}` : ' on the date shown'}
      {live === false ? ' (stored snapshot — live data unavailable)' : ''}, before hardware, power and running costs.
      Not financial advice.
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
  // Orange is never used for warnings; caveats sit on the neutral paper ground.
  const tones = {
    info: 'border-green-200 bg-green-100 text-ink-800',
    warn: 'border-ink-300 bg-white text-ink-800',
    proposal: 'border-ink-200 bg-white text-ink-800',
  } as const;
  return (
    <div className={`rounded-sm border p-4 ${tones[tone]}`}>
      {title && <p className="mb-1 font-display text-[18px] font-semibold text-ink">{title}</p>}
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

// ---- Page structure ----------------------------------------------------------------

const STEP_EYEBROW = {
  1: '!text-green-700',
  2: '!text-ink-600',
  3: '!text-orange-700',
} as const;

export function PageHeader({
  eyebrow,
  title,
  intro,
  step,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  /** Story step (1–3) colours the eyebrow: green, grey, orange. */
  step?: 1 | 2 | 3;
}) {
  return (
    <div className="border-b border-ink-200">
      <div className="container-page py-10 md:py-14">
        {eyebrow && <p className={`eyebrow mb-3 ${step ? STEP_EYEBROW[step] : ''}`}>{eyebrow}</p>}
        <h1 className="display max-w-4xl text-[44px] md:text-[64px]">{title}</h1>
        {intro && <div className="prose-body mt-5 max-w-3xl">{intro}</div>}
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
      {title && <h2 className="mb-5 text-[28px] leading-[1.1] md:text-[32px]">{title}</h2>}
      {children}
    </section>
  );
}

export function Takeaway({ children }: { children: ReactNode }) {
  return <p className="mt-3 border-l-2 border-green-500 pl-3 text-[15px] text-ink-700">{children}</p>;
}
