'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { useMemo } from 'react';
import type { Generator } from '@/lib/data/generators';
import { FUEL_COLORS, FUEL_LABELS } from '@/lib/data/generators';
import { energy } from '@/lib/format';

export interface MapGenerator extends Generator {
  modelledOutputMwh?: number;
  attributableWastedMwh?: number;
}

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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {fuelsPresent.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-xs text-navy-700">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: FUEL_COLORS[f] }} />
              {FUEL_LABELS[f]}
            </span>
          ))}
        </div>
        <button type="button" onClick={onToggleDetailed} className="btn-outline !px-3 !py-1.5 text-sm">
          {detailed ? 'Show major sites only' : 'Open detailed map'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100">
        <MapContainer
          center={[53.3, -8.0]}
          zoom={7}
          scrollWheelZoom={false}
          style={{ height: 520, width: '100%', background: '#eef4fa' }}
          attributionControl
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
          />
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
                    <p className="font-semibold text-navy-900">{g.name}</p>
                  </div>
                  <dl className="mt-1.5 space-y-0.5 text-xs text-navy-700">
                    <div className="flex justify-between gap-4"><dt>Fuel</dt><dd>{FUEL_LABELS[g.fuelType]}</dd></div>
                    <div className="flex justify-between gap-4"><dt>Capacity</dt><dd>{g.capacityMw} MW</dd></div>
                    <div className="flex justify-between gap-4"><dt>Operator</dt><dd className="text-right">{g.operator}</dd></div>
                    <div className="flex justify-between gap-4"><dt>Location</dt><dd className="text-right">{g.region}</dd></div>
                    {typeof g.modelledOutputMwh === 'number' && (
                      <div className="flex justify-between gap-4">
                        <dt>Output <span className="text-amber-700">(est.)</span></dt>
                        <dd>{energy(g.modelledOutputMwh)}</dd>
                      </div>
                    )}
                    {typeof g.attributableWastedMwh === 'number' && g.attributableWastedMwh > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt>Wasted <span className="text-amber-700">(est.)</span></dt>
                        <dd>{energy(g.attributableWastedMwh)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-navy-400">
        EirGrid publishes live fuel mix at system level, not per plant. Per-plant output shown here is an
        estimate. Coordinates/capacities are a curated seed set (EirGrid connected-generators list + OSM).
      </p>
    </div>
  );
}
