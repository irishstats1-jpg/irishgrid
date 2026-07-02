import { redirect } from 'next/navigation';

// The 20-year outlook was merged into the story pages: the BAU curtailment
// growth lives on /curtailment and the interactive scenario explorer on
// /proposal. Old links land on the proposal.
export default function ForecastPage() {
  redirect('/proposal');
}
