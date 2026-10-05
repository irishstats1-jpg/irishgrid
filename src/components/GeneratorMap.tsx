'use client';

import { useState } from 'react';
import { GENERATORS } from '@/lib/data/generators';
import { IrelandMap } from './IrelandMap';

/** The generator map with its "major sites / all sites" toggle. Locations only — no output estimates. */
export function GeneratorMap() {
  const [detailed, setDetailed] = useState(false);
  const generators = detailed ? GENERATORS : GENERATORS.filter((g) => g.isMajor);
  return <IrelandMap generators={generators} detailed={detailed} onToggleDetailed={() => setDetailed((v) => !v)} />;
}
