'use client';

/** Opens the browser's print dialog — "Save as PDF" gives an A4 copy of the brief. */
export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline print:hidden">
      {label}
    </button>
  );
}
