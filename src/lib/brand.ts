// Brand Book v2.0 constants shared by components, SVG cards and OG images.

export const COLORS = {
  peat: '#062E1D',
  green: '#169B62',
  greenText: '#0B623D',
  orange: '#F7931A',
  orangeText: '#9A5200',
  orange100: '#FEF1E2',
  paper: '#F2F2F3',
  ink: '#1D1F20',
  ink600: '#4F5357',
  rule: '#D4D6D8',
  white: '#FFFFFF',
} as const;

export const DESCRIPTOR = {
  en: 'Independent evidence on Ireland’s electricity grid',
  ga: 'Fianaise neamhspleách ar eangach leictreachais na hÉireann',
} as const;

export const NAME = { en: 'Irish Grid', ga: 'Eangach na hÉireann' } as const;

/**
 * The Index: a 3×3 grid of cells. Top row: two empty outlined cells and one
 * orange cell (top right); the two rows below are filled green — on dark
 * grounds the cells and outlines turn white, the orange cell stays orange.
 * Geometry in a 0–35 box: cells 10, gaps 2.5.
 */
export interface IndexCell {
  x: number;
  y: number;
  kind: 'outline' | 'orange' | 'fill';
}

export const INDEX_VIEWBOX = 35;
const CELL = 10;
const STEP = 12.5;

export const INDEX_CELLS: IndexCell[] = [0, 1, 2].flatMap((row) =>
  [0, 1, 2].map((col) => ({
    x: col * STEP,
    y: row * STEP,
    kind: row === 0 ? (col === 2 ? 'orange' : 'outline') : 'fill',
  })),
);

export const INDEX_CELL_SIZE = CELL;
export const INDEX_STROKE = 1.5;

/** The Index as an SVG fragment, for string-built SVG (social cards). */
export function indexMarkSvg(x: number, y: number, size: number, dark = false): string {
  const fill = dark ? COLORS.white : COLORS.green;
  const outline = dark ? COLORS.white : COLORS.ink;
  const s = INDEX_STROKE;
  const cells = INDEX_CELLS.map((c) => {
    if (c.kind === 'outline') {
      return `<rect x="${c.x + s / 2}" y="${c.y + s / 2}" width="${CELL - s}" height="${CELL - s}" fill="none" stroke="${outline}" stroke-width="${s}"/>`;
    }
    return `<rect x="${c.x}" y="${c.y}" width="${CELL}" height="${CELL}" fill="${c.kind === 'orange' ? COLORS.orange : fill}"/>`;
  }).join('');
  return `<g transform="translate(${x} ${y}) scale(${size / INDEX_VIEWBOX})">${cells}</g>`;
}
