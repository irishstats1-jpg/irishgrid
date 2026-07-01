'use client';

import { useState } from 'react';
import { IrelandMap } from '@/components/IrelandMap';
import { GENERATORS } from '@/lib/data/generators';

// Mini-map widget (§14). Embed:
// <iframe src="https://irishgrid.com/widget/map" width="440" height="620" style="border:0"></iframe>
export default function MapWidget() {
  const [detailed, setDetailed] = useState(false);
  const gens = detailed ? GENERATORS : GENERATORS.filter((g) => g.isMajor);
  return (
    <div className="p-3" style={{ maxWidth: 440 }}>
      <p className="mb-2 text-sm font-semibold text-navy-700">Ireland&apos;s major generators · Irish Grid</p>
      <IrelandMap generators={gens} detailed={detailed} onToggleDetailed={() => setDetailed((v) => !v)} />
    </div>
  );
}
