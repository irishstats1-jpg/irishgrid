import type { BtcMarket } from '../methodology/types';
import { FALLBACK_BTC_MARKET } from '../methodology/constants';

// Live market + EirGrid fetchers used by the hourly cron (§9). All fetches are
// resilient: on any failure they fall back to last-good/seed values so the site
// never breaks when an upstream source is down (§17).

export async function fetchBtcMarket(): Promise<BtcMarket> {
  const cgBase = process.env.COINGECKO_API_BASE ?? 'https://api.coingecko.com/api/v3';
  const mpBase = process.env.MEMPOOL_API_BASE ?? 'https://mempool.space/api';
  const market: BtcMarket = { ...FALLBACK_BTC_MARKET };

  try {
    const res = await fetch(`${cgBase}/simple/price?ids=bitcoin&vs_currencies=eur`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const price = json?.bitcoin?.eur;
      if (typeof price === 'number') market.priceEur = price;
    }
  } catch {
    /* keep fallback */
  }

  try {
    const res = await fetch(`${mpBase}/v1/mining/hashrate/3d`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      // mempool returns currentHashrate in H/s; convert to TH/s.
      const hps = json?.currentHashrate;
      if (typeof hps === 'number') market.networkHashrateThs = hps / 1e12;
      if (typeof json?.currentDifficulty === 'number') market.difficulty = json.currentDifficulty;
    }
  } catch {
    /* keep fallback */
  }

  return market;
}

/**
 * EirGrid Smart Grid Dashboard fetch (§6). The dashboard is served by a JSON
 * endpoint that takes `area`, `region` and a date range. Exact area codes should
 * be confirmed against the community reference implementations
 * (github.com/Daniel-Parke/EirGrid_Data_Download,
 *  github.com/dclabby/EirgridDashboardAnalysis) rather than guessed.
 */
export async function fetchEirgridArea(
  area: string,
  region: 'ROI' | 'ALL',
  from: string,
  to: string,
): Promise<unknown | null> {
  const base = process.env.EIRGRID_API_BASE ?? 'https://www.smartgriddashboard.com/DashboardService.svc/data';
  const url = `${base}?area=${encodeURIComponent(area)}&region=${region}&datefrom=${from}&dateto=${to}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
