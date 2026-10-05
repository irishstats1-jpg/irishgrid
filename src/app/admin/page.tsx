import { getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { DEFAULT_ASSUMPTIONS } from '@/lib/methodology';
import { HOUSEHOLDS } from '@/lib/data/dispatchDown';
import { asOfDate } from '@/lib/basis';
import { eur, eurModel, eurRange, gwh, num, btc } from '@/lib/format';
import { METHOD_VERSION } from '@/lib/site';
import { requireAdmin } from '@/lib/adminAuth';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

function health(marketLive: boolean) {
  const supa = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const resend = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_EMAIL);
  const openai = Boolean(process.env.OPENAI_API_KEY);
  return [
    { name: 'Supabase (DB + Auth)', ok: supa },
    { name: 'Resend (email)', ok: resend },
    { name: 'OpenAI (drafting/translation)', ok: openai },
    { name: 'Cron secret', ok: Boolean(process.env.CRON_SECRET || process.env.MAKE_SOCIAL_WEBHOOK_SECRET), note: 'Set CRON_SECRET and add the cron trigger in Cloudflare' },
    { name: 'BTC market feed', ok: marketLive, note: 'Stored snapshot in use — CoinGecko/mempool unreachable' },
  ];
}

export default async function AdminDashboard() {
  const { configured, email } = await requireAdmin();
  await refreshLiveData();
  const m = getHeadlineYear();
  const market = getBtcMarket();
  const checks = health(market.live);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          {configured ? (
            <p className="mt-1 text-sm text-ink-600">Signed in as {email}.</p>
          ) : (
            <p className="mt-1 rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700">
              Auth not configured — set Supabase env vars to require login. Access is open in this mode.
            </p>
          )}
        </div>
        {configured && <LogoutButton />}
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Data-source health</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((c) => (
            <div key={c.name} className="rounded-sm border border-ink-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{c.name}</p>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-ink-400'}`} />
              </div>
              <p className="mt-1 text-xs text-ink-500">{c.ok ? 'Configured' : c.note ?? 'Not configured'}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Headline figures ({m.year}, {m.method})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fig label="Wind dispatch-down" value={gwh(m.windMwh)} />
          <Fig label={`Compensation, modelled (${eurRange(m.cost.low, m.cost.high)})`} value={`≈ ${eurModel(m.cost.central)}`} />
          <Fig label="Gross mining revenue" value={`≈ ${eurModel(m.mining.revenue.revenueEur)}`} />
          <Fig label="BTC a year (net of pool fee)" value={btc(m.mining.revenue.btcNet)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Assumptions in effect</h2>
        <div className="rounded-sm border border-ink-200 bg-white p-4 text-sm">
          <p>Method {METHOD_VERSION} · Efficiency {DEFAULT_ASSUMPTIONS.efficiencyJPerTh} J/TH · Capture {Math.round(DEFAULT_ASSUMPTIONS.captureFactor * 100)}% · Pool fee {DEFAULT_ASSUMPTIONS.poolFee * 100}% · Subsidy {market.blockRewardBtc} BTC</p>
          <p className="mt-1 text-ink-500">Households {num(HOUSEHOLDS.count)} · BTC price {eur(market.priceEur, { decimals: 0 })} on {asOfDate(market.asOf)} ({market.live ? 'live' : 'stored snapshot'})</p>
        </div>
      </section>
    </div>
  );
}

function Fig({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-ink-200 bg-white p-4">
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-600">{label}</p>
    </div>
  );
}
