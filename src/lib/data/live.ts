import type { BtcMarket } from '../methodology/types';
import { blockRewardAt, FALLBACK_BTC_MARKET } from '../methodology/constants';

// Live Bitcoin market snapshot (CoinGecko price, mempool.space hashrate).
// Returns null unless BOTH values arrive: a live price paired with a stale
// hashrate would be a figure nobody could reproduce. The caller then uses the
// dated fallback snapshot and the page says so.

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBtcMarket(): Promise<BtcMarket | null> {
  const cgBase = process.env.COINGECKO_API_BASE ?? 'https://api.coingecko.com/api/v3';
  const mpBase = process.env.MEMPOOL_API_BASE ?? 'https://mempool.space/api';

  const [price, hashrate] = await Promise.all([
    getJson(`${cgBase}/simple/price?ids=bitcoin&vs_currencies=eur`),
    getJson(`${mpBase}/v1/mining/hashrate/3d`),
  ]);

  const priceEur = (price as { bitcoin?: { eur?: unknown } } | null)?.bitcoin?.eur;
  // mempool reports currentHashrate in H/s.
  const hps = (hashrate as { currentHashrate?: unknown } | null)?.currentHashrate;
  const difficulty = (hashrate as { currentDifficulty?: unknown } | null)?.currentDifficulty;

  if (typeof priceEur !== 'number' || !(priceEur > 0)) return null;
  if (typeof hps !== 'number' || !(hps > 0)) return null;

  const now = new Date();
  return {
    priceEur,
    networkHashrateThs: hps / 1e12,
    difficulty: typeof difficulty === 'number' ? difficulty : FALLBACK_BTC_MARKET.difficulty,
    blockRewardBtc: blockRewardAt(now.getUTCFullYear() + now.getUTCMonth() / 12),
    asOf: now.toISOString(),
    live: true,
  };
}
