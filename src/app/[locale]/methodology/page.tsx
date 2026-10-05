import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section, Callout } from '@/components/ui';
import { getAllYears, getBtcMarket, getHeadlineYear, refreshLiveData } from '@/lib/data/metrics';
import { HOUSEHOLDS } from '@/lib/data/dispatchDown';
import {
  COST_CASES,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_FORECAST_CONFIG,
  DEFAULT_MINING_COSTS,
  WHOLESALE_REF_EUR_PER_MWH,
} from '@/lib/methodology';
import { asOfDate } from '@/lib/basis';
import { METHOD_VERSION, REPO_URL } from '@/lib/site';
import { eur, eurModel, gwh, num, pct } from '@/lib/format';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/methodology' },
  title: 'Method',
  description:
    'How every figure on Irish Grid is made: the one data series used, the cost model and its assumptions, the Bitcoin revenue and cost model, the 20-year scenario, and what the site deliberately does not estimate.',
};

const REPO = REPO_URL;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-200 py-1.5 text-sm">
      <dt className="text-ink-600">{k}</dt>
      <dd className="text-right font-medium tabular-nums text-ink">{v}</dd>
    </div>
  );
}

function Formula({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-sm bg-peat p-4 text-xs leading-relaxed text-white/90">{children}</pre>
  );
}

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await refreshLiveData();
  const years = getAllYears();
  const y = getHeadlineYear();
  const market = getBtcMarket();
  const e = y.mining;
  const A = DEFAULT_ASSUMPTIONS;
  const MC = DEFAULT_MINING_COSTS;
  const F = DEFAULT_FORECAST_CONFIG;

  return (
    <>
      <PageHeader
        eyebrow={`Method · version ${METHOD_VERSION}`}
        title="How every figure is made"
        intro={
          <>
            Irish Grid uses one data series, one denominator and published assumptions. Volumes are{' '}
            <strong>reported</strong>; costs and Bitcoin figures are <strong>modelled</strong>, marked ≈ and shown with
            the assumptions below. Where no reliable figure exists, the site shows none. The code that produces every
            number is public on <a href={REPO} className="link" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </>
        }
      />

      <Section title="1 · The data: one series">
        <p className="prose-body max-w-3xl">
          Every volume on the site is <strong>wind dispatch-down in the Republic of Ireland, by calendar year</strong>,
          from the annual Renewable Energy Constraint and Curtailment reports published jointly by EirGrid and SONI.
          Solar is left out so that years are like-for-like (it was not reported on the same basis in earlier years).
          Northern Ireland and all-island figures appear only as labelled context.
        </p>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                {['Year', 'Wind dispatch-down', '% of available wind', 'Basis', 'Source'].map((h) => (
                  <th key={h} className="py-2 pr-4 font-display text-[14px] font-semibold text-ink-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((m) => (
                <tr key={m.year} className="border-b border-ink-200 align-top">
                  <td className="py-2 pr-4 font-medium">{m.year}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.method === 'reported' ? '' : '≈ '}{gwh(m.windMwh)}</td>
                  <td className="py-2 pr-4 tabular-nums">{m.windPctOfAvailable !== null ? pct(m.windPctOfAvailable) : '—'}</td>
                  <td className="py-2 pr-4">{m.method === 'reported' ? 'Reported' : 'Provisional'}</td>
                  <td className="py-2">
                    <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="link">{m.sourceTitle}</a>
                    {m.notes && <span className="block text-[12px] text-ink-500">{m.notes}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="prose-body mt-4 max-w-3xl list-disc space-y-2 pl-5 text-[15px]">
          <li>
            <strong>Headlines use the latest reported year</strong> ({y.year}). A provisional year is shown, labelled,
            and never leads.
          </li>
          <li>
            <strong>Reported figures cannot be overwritten by the database.</strong> The reviewed figures live in the
            code; a database row can only fill a year that is missing or provisional, and only with a reported figure.
            Every change to a reported figure is therefore a public code change.
          </li>
          <li>
            <strong>No short-period figures.</strong> EirGrid does not publish dispatch-down by day or week in a form
            this site can verify, so the site shows none, rather than an estimate that looks like data.
          </li>
          <li>
            <strong>No per-plant figures.</strong> Output and dispatch-down are not published by site; the map shows
            locations and capacity only.
          </li>
        </ul>
      </Section>

      <Section title="2 · The cost to billpayers (modelled)">
        <p className="prose-body max-w-3xl">
          No public source gives the compensation paid each year for wind dispatch-down, so the cost is modelled from
          the volume. <strong>Constraint</strong> (local network limits) is generally compensated for generators with
          firm access; <strong>curtailment</strong> (system-wide limits) is largely uncompensated for newer generators.
          The volume is split between the two — using the reported split where the report gives one — and each part is
          multiplied by an assumed compensated share and rate. Three cases give the range.
        </p>
        <Formula>{`constraint_MWh   = volume × constraint_share
curtailment_MWh  = volume − constraint_MWh
compensated_MWh  = curtailment_MWh × share_paid_curtailment
                 + constraint_MWh  × share_paid_constraint
cost_€           = compensated_MWh × compensation_€_per_MWh
per_household_€  = cost_€ ÷ ${num(HOUSEHOLDS.count)}`}</Formula>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                {['Assumption', 'Low', 'Central', 'High'].map((h) => (
                  <th key={h} className="py-2 pr-4 font-display text-[14px] font-semibold text-ink-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Compensation rate', (c: typeof COST_CASES.low) => `€${c.compensationEurPerMwh}/MWh`],
                ['Share of constraint compensated', (c: typeof COST_CASES.low) => pct(c.compensatedShareConstraint * 100, 0)],
                ['Share of curtailment compensated', (c: typeof COST_CASES.low) => pct(c.compensatedShareCurtailment * 100, 0)],
                ['Constraint share, where not reported', (c: typeof COST_CASES.low) => pct(c.defaultConstraintShare * 100, 0)],
              ].map(([label, f]) => (
                <tr key={label as string} className="border-b border-ink-200">
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-700">{label as string}</th>
                  {(['low', 'central', 'high'] as const).map((k) => (
                    <td key={k} className="py-2 pr-4 tabular-nums">{(f as (c: typeof COST_CASES.low) => string)(COST_CASES[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card mt-4 max-w-2xl">
          <h3 className="mb-2 font-semibold text-ink">Worked example — {y.year}</h3>
          <dl>
            <Row k="Wind dispatch-down (reported)" v={gwh(y.windMwh)} />
            <Row k={`Constraint share (${y.constraintShareReported ? 'reported' : 'assumed'})`} v={pct(y.constraintShare * 100, 0)} />
            <Row k="Cost, central case" v={`≈ ${eurModel(y.cost.central)}`} />
            <Row k="Range, low–high" v={`${eurModel(y.cost.low)}–${eurModel(y.cost.high)}`} />
            <Row k="Per household, central" v={`≈ ${eurModel(y.costPerHousehold.central)}`} />
          </dl>
        </div>
        <ul className="prose-body mt-4 max-w-3xl list-disc space-y-2 pl-5 text-[15px]">
          <li>
            <strong>One denominator:</strong> {num(HOUSEHOLDS.count)} private households (
            <a href={HOUSEHOLDS.sourceUrl} target="_blank" rel="noopener noreferrer" className="link">{HOUSEHOLDS.source}</a>
            ). &ldquo;Per household&rdquo; is an equivalent for scale. Costs are recovered across all customers,
            including businesses, so it is not a line on any household&apos;s bill.
          </li>
          <li>
            <strong>Replacement cost is context only.</strong> When a constraint turns a wind farm down, another
            generator is turned up. The site values the constrained volume at a reference wholesale price of{' '}
            {eur(WHOLESALE_REF_EUR_PER_MWH, { decimals: 0 })}/MWh and never adds it to the compensation range. Curtailed volume is
            excluded: that power could not have been used.
          </li>
          <li>
            <strong>Rounding:</strong> modelled € figures are rounded to two significant figures and marked ≈.
          </li>
        </ul>
      </Section>

      <Section title="3 · Bitcoin revenue and costs (modelled)">
        <p className="prose-body max-w-3xl">
          The orange figures answer one question: what would a fleet earn if it used the dispatched-down energy at
          today&apos;s Bitcoin price and network? It is a counterpart for scale, not a claim about the past — the
          network and price in earlier years were different.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 font-semibold text-ink">Gross revenue</h3>
            <Formula>{`used_MWh      = volume × capture_factor
work_TH       = used_MWh × 3.6×10⁹ J ÷ efficiency_J_per_TH
fleet_TH/s    = work_TH ÷ seconds_in_year
share         = fleet_TH/s ÷ network_TH/s
BTC           = blocks_in_year × block_subsidy × share × (1 − pool_fee)
revenue_€     = BTC × price_€`}</Formula>
            <dl className="mt-3">
              <Row k="Miner efficiency" v={`${A.efficiencyJPerTh} J/TH`} />
              <Row k="Capture factor" v={pct(A.captureFactor * 100, 0)} />
              <Row k="Pool fee" v={pct(A.poolFee * 100, 1)} />
              <Row k="Block subsidy" v={`${market.blockRewardBtc} BTC (fees excluded)`} />
              <Row k={`BTC price, ${asOfDate(market.asOf)}`} v={eur(market.priceEur, { decimals: 0 })} />
              <Row k="Network hashrate" v={`${num(market.networkHashrateThs / 1e6, 0)} EH/s`} />
              <Row k="Market data" v={market.live ? 'Live (CoinGecko, mempool.space), hourly' : 'Stored snapshot — live data unavailable'} />
            </dl>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold text-ink">Net result</h3>
            <Formula>{`fleet_MW      = used_MWh ÷ hours_with_surplus
capex_€/yr    = fleet_TH/s × hardware_€ ÷ hardware_life
              + fleet_kW × site_€ ÷ site_life
opex_€/yr     = used_MWh × (operations + network + generator payment)
net_€         = revenue_€ − capex_€/yr − opex_€/yr
break_even_€  = (capex_€/yr + opex_€/yr) ÷ BTC`}</Formula>
            <dl className="mt-3">
              <Row k="Hours a year with surplus" v={num(MC.surplusHoursPerYear)} />
              <Row k="Hardware" v={`€${MC.hardwareEurPerThs} per TH/s, over ${MC.hardwareLifeYears} years`} />
              <Row k="Site and connection" v={`€${MC.infrastructureEurPerKw}/kW, over ${MC.infrastructureLifeYears} years`} />
              <Row k="Operations" v={`€${MC.operatingEurPerMwh}/MWh`} />
              <Row k="Network charges" v={`€${MC.networkChargesEurPerMwh}/MWh`} />
              <Row k="Payment to the generator" v={`€${MC.energyPaymentEurPerMwh}/MWh`} />
            </dl>
          </div>
        </div>
        <div className="card mt-4 max-w-2xl">
          <h3 className="mb-2 font-semibold text-ink">Worked example — {y.year} volume, today&apos;s market</h3>
          <dl>
            <Row k="Fleet needed" v={`≈ ${num(Math.round(e.fleetMw))} MW`} />
            <Row k="Share of the network" v={pct(e.revenue.networkSharePct, 2)} />
            <Row k="BTC a year (after pool fee)" v={`≈ ${num(e.revenue.btcNet, 0)}`} />
            <Row k="Gross revenue" v={`≈ ${eurModel(e.revenue.revenueEur)}`} />
            <Row k="Costs a year" v={`≈ ${eurModel(e.totalAnnualCostEur)}`} />
            <Row k="Net" v={`≈ ${eurModel(e.netEur)}`} />
            <Row k="Break-even BTC price" v={`≈ ${eurModel(e.breakEvenPriceEur)}`} />
          </dl>
        </div>
        <p className="prose-body mt-3 max-w-3xl text-sm">
          Every cost is an Irish Grid assumption, not a quote; readers can change each one in the calculator on the{' '}
          <Link href="/proposal" className="link">policy option page</Link>.
        </p>
      </Section>

      <Section title="4 · The 20-year scenario">
        <dl className="card max-w-2xl">
          <Row k="Wind and solar capacity" v={F.capacityAnchors.map((a) => `${a.gw} GW (${a.year})`).join(' · ')} />
          <Row k="Blended capacity factor" v={pct(F.capacityFactor * 100, 0)} />
          <Row k="Dispatch-down rate at today's capacity" v={`${pct(F.dispatchDownBaseRate * 100, 1)} (${y.year} reported rate)`} />
          <Row k="Rise per extra GW, business as usual" v={`${pct(F.dispatchDownSlopePerGw * 100, 1)} points (capped at ${pct(F.dispatchDownMaxRate * 100, 0)})`} />
          <Row k="Share used by flexible demand" v={pct(F.flexibleAbsorbedShare * 100, 0)} />
          <Row k="Network hashrate growth" v={`${pct(F.networkGrowth * 100, 0)} a year`} />
          <Row k="BTC price change" v={`${pct(F.priceGrowth * 100, 0)} a year`} />
          <Row k="Block subsidy" v="Halves in 2028, 2032, 2036, …" />
        </dl>
        <p className="prose-body mt-3 max-w-3xl text-sm">
          Capacity anchors follow the Climate Action Plan (about 22 GW of wind and solar by 2030) and the offshore
          targets for 2040 and 2050. The dispatch-down slope is an Irish Grid assumption: a grid that is reinforced
          would see far less.
        </p>
      </Section>

      <Section title="5 · Sources">
        <div className="card">
          <ul className="divide-y divide-ink-200 text-sm">
            {[
              ['EirGrid & SONI, Annual Renewable Energy Constraint and Curtailment Reports, 2020–2024', 'https://cms.eirgrid.ie/taxonomy/term/27'],
              [HOUSEHOLDS.source, HOUSEHOLDS.sourceUrl],
              ['CSO, Data Centres Metered Electricity Consumption 2024', 'https://www.cso.ie/en/releasesandpublications/ep/p-dcmec/datacentresmeteredelectricityconsumption2024/'],
              ['Government of Ireland, Climate Action Plan 2025', 'https://www.gov.ie/en/department-of-climate-energy-and-the-environment/press-releases/government-approves-climate-action-plan-2025/'],
              ['SEAI, Ireland’s energy targets', 'https://www.seai.ie/about/irelands-energy-targets'],
              ['CoinGecko (BTC price in euro)', 'https://www.coingecko.com/en/coins/bitcoin/eur'],
              ['mempool.space (network hashrate and difficulty)', 'https://mempool.space/graphs/mining/hashrate-difficulty'],
              ['Cambridge Bitcoin Electricity Consumption Index', 'https://ccaf.io/cbnsi/cbeci'],
            ].map(([name, href]) => (
              <li key={href} className="py-2.5">
                <a href={href} target="_blank" rel="noopener noreferrer" className="link">{name}</a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Corrections">
        <Callout tone="proposal" title="Found an error?">
          Open an issue on <a href={`${REPO}/issues`} className="link" target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
          or use the form on <Link href="/get-involved" className="link">Get involved</Link>. Corrections to figures are
          made in public, with the change visible in the code history.
        </Callout>
      </Section>
    </>
  );
}
