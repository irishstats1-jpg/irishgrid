import { computePeriodMetrics, refreshLiveData } from '@/lib/data/metrics';
import { DEFAULT_ASSUMPTIONS, FALLBACK_BTC_MARKET } from '@/lib/methodology';
import { eur, energy, num, btc } from '@/lib/format';
import { requireAdmin } from '@/lib/adminAuth';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

function health() {
  const supa = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const resend = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_EMAIL);
  const openai = Boolean(process.env.OPENAI_API_KEY);
  return [
    { name: 'Supabase (DB + Auth)', ok: supa },
    { name: 'Resend (email)', ok: resend },
    { name: 'OpenAI (drafting/translation)', ok: openai },
    { name: 'EirGrid ingestion (cron)', ok: false, note: 'Wire hourly Cloudflare cron' },
    { name: 'BTC market feed', ok: true, note: 'Fallback snapshot active' },
  ];
}

export default async function AdminDashboard() {
  const { configured, email } = await requireAdmin();
  await refreshLiveData();
  const m = computePeriodMetrics('last_365');
  const checks = health();

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
        <h2 className="mb-3 font-semibold text-ink">Latest headline figures (last 365 days)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fig label="Wasted energy" value={energy(m.wastedMwh)} />
          <Fig label="Cost to billpayers" value={eur(m.costEur, { compact: true })} />
          <Fig label="BTC value if mined" value={eur(m.btcValueEur, { compact: true })} />
          <Fig label="BTC mined (net)" value={btc(m.btcMinedNet)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Assumptions in effect</h2>
        <div className="rounded-sm border border-ink-200 bg-white p-4 text-sm">
          <p>Efficiency {DEFAULT_ASSUMPTIONS.efficiencyJPerTh} J/TH · Uptime {Math.round(DEFAULT_ASSUMPTIONS.uptimeFactor * 100)}% · Pool fee {DEFAULT_ASSUMPTIONS.poolFee * 100}% · Reward {DEFAULT_ASSUMPTIONS.blockRewardBtc} BTC</p>
          <p className="mt-1 text-ink-500">Billpayers {num(DEFAULT_ASSUMPTIONS.nBillpayers)} · BTC price {eur(FALLBACK_BTC_MARKET.priceEur, { compact: true })} (edit under Assumptions)</p>
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
