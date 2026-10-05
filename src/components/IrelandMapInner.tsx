'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, GeoJSON, CircleMarker, Pane, Popup, Tooltip } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import type { Generator } from '@/lib/data/generators';
import { FUEL_COLORS, FUEL_LABELS } from '@/lib/data/generators';

export type MapGenerator = Generator;

function radiusFor(capacityMw: number): number {
  return Math.max(5, Math.min(20, Math.sqrt(capacityMw) / 2.1));
}

export default function IrelandMapInner({
  generators,
  detailed,
  onToggleDetailed,
}: {
  generators: MapGenerator[];
  detailed: boolean;
  onToggleDetailed: () => void;
}) {
  const fuelsPresent = useMemo(
    () => Array.from(new Set(generators.map((g) => g.fuelType))),
    [generators],
  );
  // On touch screens one finger scrolls the page; two fingers move and zoom the
  // map (Leaflet's pinch handler pans as well as zooms).
  const coarse = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, []);
  const sorted = useMemo(() => [...generators].sort((a, b) => b.capacityMw - a.capacityMw), [generators]);
  // Coastline drawn from a self-hosted outline (Natural Earth, public domain):
  // no third-party tile server, no API key, nothing to break.
  const [outline, setOutline] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    fetch('/geo/ireland.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setOutline)
      .catch(() => setOutline(null));
  }, []);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {fuelsPresent.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-xs text-ink-700">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: FUEL_COLORS[f] }} />
              {FUEL_LABELS[f]}
            </span>
          ))}
        </div>
        <button type="button" onClick={onToggleDetailed} className="btn-outline !px-3 !py-1.5 text-sm">
          {detailed ? 'Show major sites only' : 'Open detailed map'}
        </button>
      </div>

      <div className="relative isolate overflow-hidden rounded-sm border border-ink-200">
        {coarse && (
          <p className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-sm bg-white/90 px-2 py-1 text-[12px] text-ink-700">
            Use two fingers to move the map
          </p>
        )}
        <MapContainer
          center={[53.3, -8.0]}
          zoom={7}
          minZoom={6}
          maxZoom={10}
          maxBounds={[[50.8, -11.8], [55.9, -4.5]]}
          scrollWheelZoom={false}
          dragging={!coarse}
          touchZoom
          style={{ height: 520, width: '100%', background: '#E6EEF2' }}
          attributionControl
        >
          {/* Its own pane under the markers, so the outline never covers them. */}
          <Pane name="outline" style={{ zIndex: 250 }}>
          {outline && (
            <GeoJSON
              data={outline}
              interactive={false}
              style={{ color: '#B5B8BB', weight: 1, fillColor: '#FFFFFF', fillOpacity: 1 }}
              attribution='Outline: <a href="https://www.naturalearthdata.com/">Natural Earth</a>'
            />
          )}
          </Pane>
          {generators.map((g) => (
            <CircleMarker
              key={g.id}
              center={[g.lat, g.lng]}
              radius={radiusFor(g.capacityMw)}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: FUEL_COLORS[g.fuelType],
                fillOpacity: 0.85,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                <span className="font-semibold">{g.name}</span> · {FUEL_LABELS[g.fuelType]}
              </Tooltip>
              <Popup>
                <div className="min-w-[12rem]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: FUEL_COLORS[g.fuelType] }} />
                    <p className="font-semibold text-ink">{g.name}</p>
                  </div>
                  <dl className="mt-1.5 space-y-0.5 text-xs text-ink-700">
                    <div className="flex justify-between gap-4"><dt>Fuel</dt><dd>{FUEL_LABELS[g.fuelType]}</dd></div>
                    <div className="flex justify-between gap-4"><dt>Capacity</dt><dd>{g.capacityMw} MW</dd></div>
                    <div className="flex justify-between gap-4"><dt>Operator</dt><dd className="text-right">{g.operator}</dd></div>
                    <div className="flex justify-between gap-4"><dt>Location</dt><dd className="text-right">{g.region}</dd></div>
                  </dl>
                  {g.note && <p className="mt-1.5 text-xs text-ink-600">{g.note}</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-green-700">List view ({sorted.length} sites)</summary>
        <div className="mt-2 max-h-80 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                {['Site', 'Type', 'Capacity', 'Operator', 'County'].map((h) => (
                  <th key={h} scope="col" className="py-1.5 pr-3 font-display text-[14px] font-semibold text-ink-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => (
                <tr key={g.id} className="border-b border-ink-200 align-top">
                  <th scope="row" className="py-1.5 pr-3 text-left font-medium">
                    {g.name}
                    {g.note && <span className="block text-[12px] font-normal text-ink-500">{g.note}</span>}
                  </th>
                  <td className="py-1.5 pr-3">{FUEL_LABELS[g.fuelType]}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{g.capacityMw} MW</td>
                  <td className="py-1.5 pr-3">{g.operator}</td>
                  <td className="py-1.5">{g.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="mt-2 text-xs text-ink-500">
        A partial, curated list of large generators and interconnectors — location, fuel and capacity only, last
        reviewed October 2026. Ireland has several hundred wind farms; most are not shown. Coordinates are
        approximate.
      </p>
    </div>
  );
}
