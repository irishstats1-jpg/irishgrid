'use client';

import { useTranslations } from 'next-intl';

// "The Ceiling" (Brand Book §02): five bars of generation under a line the grid
// can't exceed. What spills over the ceiling turns orange — the whole argument
// in one glyph. Drawn on a 48-unit square: bars 6 wide on an 8-unit pitch, the
// ceiling at 20 units from the top (1.5 thick, overhanging the bars by 3 each
// side), a 3-unit gap either side of it, bar tops 30 · 12 · 5 · 15 · 26.
const BAR_X = [5, 13, 21, 29, 37];
const BAR_TOPS = [30, 12, 5, 15, 26];
const BAR_W = 6;
const BOTTOM = 43;
const CEILING_Y = 20;
const CEILING_H = 1.5;
const GAP = 3;
const ORANGE_FLOOR = CEILING_Y - GAP; // 17
const GREEN_CEIL = CEILING_Y + CEILING_H + GAP; // 24.5

export const MARK_COLORS = {
  green: '#169B62',
  orange: '#F7931A',
  ink: '#1D1F20',
  white: '#FFFFFF',
} as const;

/** The mark alone. `tone="dark"` is for peat, green or ink grounds. */
export function CeilingMark({
  tone = 'light',
  className = 'h-8 w-8',
  title = 'Irish Grid',
}: {
  tone?: 'light' | 'dark';
  className?: string;
  title?: string;
}) {
  const bar = tone === 'dark' ? MARK_COLORS.white : MARK_COLORS.green;
  const ceiling = tone === 'dark' ? MARK_COLORS.white : MARK_COLORS.ink;
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      {BAR_X.map((x, i) => {
        const top = BAR_TOPS[i];
        const greenTop = Math.max(top, GREEN_CEIL);
        return (
          <g key={x}>
            {top < ORANGE_FLOOR && (
              <rect x={x} y={top} width={BAR_W} height={ORANGE_FLOOR - top} fill={MARK_COLORS.orange} />
            )}
            <rect x={x} y={greenTop} width={BAR_W} height={BOTTOM - greenTop} fill={bar} />
          </g>
        );
      })}
      <rect x={2} y={CEILING_Y} width={44} height={CEILING_H} fill={ceiling} />
    </svg>
  );
}

/**
 * Horizontal lockup: mark + wordmark in Barlow Condensed SemiBold caps, +6%
 * tracking. The Irish-language lockup reads "EANGACH NA hÉIREANN" — set as a
 * literal string so the lenited h stays lower case (CSS uppercase would break it).
 */
export function Wordmark({
  tone = 'light',
  className = '',
  markClassName = 'h-8 w-8',
}: {
  tone?: 'light' | 'dark';
  className?: string;
  markClassName?: string;
}) {
  const t = useTranslations('brand');
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CeilingMark tone={tone} className={markClassName} title="" />
      <span
        className={`font-display text-[22px] font-semibold leading-none tracking-[0.06em] ${
          tone === 'dark' ? 'text-white' : 'text-ink'
        }`}
      >
        {t('wordmark')}
      </span>
    </span>
  );
}
