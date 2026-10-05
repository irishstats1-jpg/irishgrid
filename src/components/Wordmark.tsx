'use client';

import { useLocale } from 'next-intl';
import { COLORS, DESCRIPTOR, INDEX_CELLS, INDEX_CELL_SIZE, INDEX_STROKE, INDEX_VIEWBOX, NAME } from '@/lib/brand';

// "The Index" (Brand Book v2.0): a 3×3 grid of cells. The top row is two empty
// outlined cells and one orange cell — the surplus and the option — over two
// rows of grid green. On dark grounds the cells and outlines turn white; the
// orange cell always stays orange. Minimum size 16px; clear space one cell.

/** The mark alone. `tone="dark"` is for peat, green or ink grounds. */
export function IndexMark({
  tone = 'light',
  className = 'h-8 w-8',
  title = 'Irish Grid',
}: {
  tone?: 'light' | 'dark';
  className?: string;
  title?: string;
}) {
  const fill = tone === 'dark' ? COLORS.white : COLORS.green;
  const outline = tone === 'dark' ? COLORS.white : COLORS.ink;
  const s = INDEX_STROKE;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${INDEX_VIEWBOX} ${INDEX_VIEWBOX}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      {INDEX_CELLS.map((c) =>
        c.kind === 'outline' ? (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x + s / 2}
            y={c.y + s / 2}
            width={INDEX_CELL_SIZE - s}
            height={INDEX_CELL_SIZE - s}
            fill="none"
            stroke={outline}
            strokeWidth={s}
          />
        ) : (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width={INDEX_CELL_SIZE}
            height={INDEX_CELL_SIZE}
            fill={c.kind === 'orange' ? COLORS.orange : fill}
          />
        ),
      )}
    </svg>
  );
}

/**
 * Lockup: the Index, the name in Barlow Condensed SemiBold (title case), and
 * the descriptor in Barlow Regular. Irish: "Eangach na hÉireann".
 */
export function Wordmark({
  tone = 'light',
  className = '',
  markClassName = 'h-8 w-8',
  descriptor = 'always',
}: {
  tone?: 'light' | 'dark';
  className?: string;
  markClassName?: string;
  /** Show the descriptor line: always, from a breakpoint, or never. */
  descriptor?: 'always' | 'md' | 'xl' | 'never';
}) {
  const locale = useLocale() === 'ga' ? 'ga' : 'en';
  const descClass = { always: 'block', md: 'hidden md:block', xl: 'hidden xl:block', never: 'hidden' }[descriptor];
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <IndexMark tone={tone} className={`${markClassName} shrink-0`} title="" />
      <span className="flex flex-col">
        <span className={`font-display text-[22px] font-semibold leading-none ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>
          {NAME[locale]}
        </span>
        <span className={`${descClass} mt-1 text-[12px] leading-tight ${tone === 'dark' ? 'text-white/75' : 'text-ink-600'}`}>
          {DESCRIPTOR[locale]}
        </span>
      </span>
    </span>
  );
}
