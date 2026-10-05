'use client';

import dynamic from 'next/dynamic';
import type { MapGenerator } from './IrelandMapInner';

export type { MapGenerator } from './IrelandMapInner';

// Leaflet touches `window`, so the map is loaded client-only (no SSR).
const IrelandMapInner = dynamic(() => import('./IrelandMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-sm border border-ink-200 bg-white text-sm text-ink-500">
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
