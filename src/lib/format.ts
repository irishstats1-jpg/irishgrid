// Formatting helpers shared across pages, charts and widgets.

export function eur(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals } = opts;
  if (compact && Math.abs(value) >= 1000) {
    // Formatted by hand rather than with Intl's compact notation: Node's and the
    // browser's ICU disagree on it ("€152.0M" vs "€152M"), which caused React
    // hydration mismatches on every page with a client-rendered € figure.
    const abs = Math.abs(value);
    const [div, suffix] = abs >= 1e9 ? [1e9, 'B'] : abs >= 1e6 ? [1e6, 'M'] : [1e3, 'K'];
    const scaled = Math.round((abs / div) * 10) / 10;
    return `${value < 0 ? '-' : ''}€${scaled}${suffix}`;
  }
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: decimals ?? (Math.abs(value) < 100 ? 2 : 0),
  }).format(value);
}

/** Round to `digits` significant figures. */
export function roundSig(value: number, digits = 2): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  const p = Math.pow(10, digits - Math.ceil(Math.log10(Math.abs(value))));
  return Math.round(value * p) / p;
}

/**
 * A modelled € figure: two significant figures, so a model never claims more
 * precision than it has ("€55M", "€30", "€0.87").
 */
export function eurModel(value: number): string {
  const r = roundSig(value, 2);
  if (Math.abs(r) >= 1000) return eur(r, { compact: true });
  return eur(r, { decimals: Math.abs(r) >= 10 ? 0 : 2 });
}

/** A modelled range: "€28M–€84M". */
export function eurRange(low: number, high: number): string {
  return `${eurModel(low)}–${eurModel(high)}`;
}

/** Reported volumes stay in GWh, exactly as published ("1,266 GWh"). */
export function gwh(mwh: number): string {
  return `${Math.round(mwh / 1000).toLocaleString('en-IE')} GWh`;
}

/**
 * MWh → human string, per the brand's unit rule (§07.2): TWh to one decimal at
 * or above 1,000 GWh; GWh as whole numbers below; MWh under 1 GWh.
 */
export function energy(mwh: number): string {
  if (Math.abs(mwh) >= 1_000_000) {
    return `${(mwh / 1_000_000).toLocaleString('en-IE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} TWh`;
  }
  if (Math.abs(mwh) >= 1000) {
    return `${Math.round(mwh / 1000).toLocaleString('en-IE')} GWh`;
  }
  return `${Math.round(mwh).toLocaleString('en-IE')} MWh`;
}

export function num(value: number, decimals = 0): string {
  return value.toLocaleString('en-IE', { maximumFractionDigits: decimals });
}

export function pct(value: number, decimals = 1): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: decimals })}%`;
}

export function btc(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })} BTC`;
}
