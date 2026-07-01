import type { Metadata } from 'next';
import { unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { PageHeader, Section, Callout } from '@/components/ui';
import { ForecastExplorer } from '@/components/ForecastExplorer';

export const metadata: Metadata = {
  title: 'The 20-year outlook — curtailment and savings scenarios',
  description:
    "A scenario-based projection (not a prediction) of how Ireland's renewable capacity, curtailment, and potential per-household savings from flexible mining could grow to ~2046, with adjustable assumptions and clear caveats.",
};

export default function ForecastPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <>
      <PageHeader
        eyebrow="2026 → 2046"
        title="As Ireland builds renewables, curtailment grows — and so does the opportunity"
        intro={
          <>
            These are <strong>scenarios, not predictions</strong>. They are anchored on Ireland&apos;s
            published capacity targets and EirGrid/SONI&apos;s <em>Tomorrow&apos;s Energy Scenarios</em>,
            calibrated to the historical dispatch-down trend. Every assumption below is adjustable — move the
            sliders and watch the curtailment curve and per-household savings recompute live.
          </>
        }
      />

      <Section>
        <Callout tone="warn" title="Read this first">
          The curtailment curve is modelled to rise with renewable penetration, calibrated to the historical
          wind dispatch-down trend (8.5% → 10.7% → 14.0%, 2022–2024). Long-range grid mitigations — new
          transmission, storage, the Celtic Interconnector, a higher SNSP limit, and fewer must-run units —
          could reduce curtailment independently of mining. Bitcoin value is volatile. Treat all figures as
          illustrative scenario outputs.
        </Callout>
      </Section>

      <Section title="Explore the scenarios">
        <ForecastExplorer />
      </Section>

      <Section title="How to read the two branches">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-orange-700">Business-as-usual grid</h3>
            <p className="prose-body mt-2">
              Curtailment keeps climbing as capacity outpaces grid, storage and interconnection. This is the
              orange curve — clean energy generated and thrown away, growing year on year.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-sky-700">With flexible mining load</h3>
            <p className="prose-body mt-2">
              Interruptible mining absorbs a configurable share of would-be-curtailed energy — the blue area
              — turning waste into recovered value and per-household savings that rise alongside the problem.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
