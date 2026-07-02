'use client';

import dynamic from 'next/dynamic';
import type { MapGenerator } from './IrelandMapInner';

export type { MapGenerator } from './IrelandMapInner';

// Leaflet touches `window`, so the map is loaded client-only (no SSR).
const IrelandMapInner = dynamic(() => import('./IrelandMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-xl border border-navy-100 bg-sky-50 text-sm text-navy-400">
      Loading map…
    </div>
  ),
});

export function IrelandMap(props: {
  generators: MapGenerator[];
  detailed: boolean;
  onToggleDetailed: () => void;
}) {
  return <IrelandMapInner {...props} />;
}
