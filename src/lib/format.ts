// Formatting helpers shared across pages, charts and widgets.

export function eur(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals } = opts;
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: decimals ?? (Math.abs(value) < 100 ? 2 : 0),
  }).format(value);
}

/** MWh → human GWh/MWh string. */
export function energy(mwh: number): string {
  if (Math.abs(mwh) >= 1_000_000) {
    return `${(mwh / 1_000_000).toLocaleString('en-IE', { maximumFractionDigits: 2 })} TWh`;
  }
  if (Math.abs(mwh) >= 1000) {
    return `${(mwh / 1000).toLocaleString('en-IE', { maximumFractionDigits: 1 })} GWh`;
  }
  return `${mwh.toLocaleString('en-IE', { maximumFractionDigits: 0 })} MWh`;
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
