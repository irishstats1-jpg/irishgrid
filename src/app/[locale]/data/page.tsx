import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageHeader, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Data for researchers',
  description:
    'Download the underlying data behind Irish Grid as CSV: generation snapshots, dispatch-down actuals, computed period metrics and the generator list, with a data dictionary.',
};

const DATASETS = [
  {
    slug: 'generation-snapshots',
    title: 'Generation snapshots',
    desc: 'Daily fuel-mix, demand, available wind and modelled wasted energy.',
    dict: ['date', 'demand_mwh', 'wind_available_mwh', '<fuel>_mwh', 'wasted_mwh'],
  },
  {
    slug: 'dispatch-down-actuals',
    title: 'Dispatch-down actuals',
    desc: 'Official annual curtailment + constraint volumes (2022–2024).',
    dict: ['year', 'total_gwh', 'curtailment_gwh', 'constraint_gwh', 'wind_dispatch_down_pct', 'source'],
  },
  {
    slug: 'period-metrics',
    title: 'Computed period metrics',
    desc: 'Produced, wasted, cost and BTC-savings figures per duration.',
    dict: ['period', 'is_estimate', 'produced_mwh', 'wasted_mwh', 'cost_eur', 'btc_value_eur', 'saving_per_billpayer_eur'],
  },
  {
    slug: 'generators',
    title: 'Generators',
    desc: 'Curated generator list with fuel, capacity, operator and coordinates.',
    dict: ['id', 'name', 'fuel_type', 'capacity_mw', 'operator', 'lat', 'lng', 'is_major'],
  },
];

export default function DataPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="Open data"
        title="Data for researchers"
        intro={
          <>
            Everything on Irish Grid is built on public data. Download the underlying series as CSV. Short-period
            figures are modelled estimates; annual figures use official actuals — see the{' '}
            <Link href="/about" className="font-medium text-sky-600 underline">Methodology</Link>.
          </>
        }
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {DATASETS.map((d) => (
            <div key={d.slug} className="card">
              <h3 className="font-semibold text-navy-900">{d.title}</h3>
              <p className="prose-body mt-1">{d.desc}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-navy-500">Columns</p>
              <p className="mt-1 font-mono text-xs text-navy-700">{d.dict.join(' · ')}</p>
              <a href={`/api/data/${d.slug}`} className="btn-primary mt-4" download>
                Download CSV
              </a>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
