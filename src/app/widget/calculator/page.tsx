import { SavingsCalculator } from '@/components/SavingsCalculator';

// BTC savings calculator widget (§14). Embed:
// <iframe src="https://irishgrid.com/widget/calculator" width="640" height="360" style="border:0"></iframe>
export default function CalculatorWidget() {
  return (
    <div className="p-2">
      <SavingsCalculator compact />
    </div>
  );
}
