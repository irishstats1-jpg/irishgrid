'use client';

import { useMemo, useState } from 'react';
import type { Generator } from '@/lib/data/generators';
import { FUEL_COLORS, FUEL_LABELS } from '@/lib/data/generators';
import { energy } from '@/lib/format';

// Projection bounds for the island of Ireland.
const LAT_N = 55.6;
const LAT_S = 51.2;
const LNG_W = -10.8;
const LNG_E = -5.6;
const W = 400;
const H = 520;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_W) / (LNG_E - LNG_W)) * W;
  const y = ((LAT_N - lat) / (LAT_N - LAT_S)) * H;
  return [x, y];
}

// Simplified coastline (clockwise from Malin Head) → filled island silhouette.
const COAST: Array<[number, number]> = [
  [55.38, -7.37], [55.28, -7.0], [55.2, -6.15], [54.6, -5.7], [54.4, -5.5],
  [54.05, -5.9], [53.85, -6.1], [53.35, -6.15], [52.96, -5.99], [52.55, -6.12],
  [52.25, -6.34], [52.12, -6.93], [52.15, -7.55], [51.95, -7.85], [51.79, -8.24],
  [51.6, -8.9], [51.45, -9.81], [51.6, -10.15], [51.9, -10.35], [52.15, -10.4],
  [52.56, -9.93], [52.7, -9.6], [53.1, -9.9], [53.4, -10.23], [53.75, -10.15],
  [54.0, -10.1], [54.32, -10.0], [54.25, -9.2], [54.3, -8.6], [54.63, -8.8],
  [54.8, -8.65], [55.15, -8.3], [55.28, -7.63],
];

export interface MapGenerator extends Generator {
  modelledOutputMwh?: number;
  attributableWastedMwh?: number;
}

export function IrelandMap({
  generators,
  detailed,
  onToggleDetailed,
}: {
  generators: MapGenerator[];
  detailed: boolean;
  onToggleDetailed: () => void;
}) {
  const [active, setActive] = useState<MapGenerator | null>(null);

  const islandPath = useMemo(() => {
    const pts = COAST.map(([lat, lng]) => project(lat, lng));
    return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') + ' Z';
  }, []);

  const fuelsPresent = useMemo(
    () => Array.from(new Set(generators.map((g) => g.fuelType))),
    [generators],
  );

  return (
    <div className="relative">
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

      <div className="relative overflow-hidden rounded-xl border border-navy-100 bg-sky-50">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of Ireland showing electricity generators by fuel type">
          <path d={islandPath} fill="#dbe7f2" stroke="#9db8d4" strokeWidth={1.5} />
          {generators.map((g) => {
            const [x, y] = project(g.lat, g.lng);
            const r = Math.max(4, Math.min(16, Math.sqrt(g.capacityMw) / 2.4));
            const isActive = active?.id === g.id;
            return (
              <g key={g.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={FUEL_COLORS[g.fuelType]}
                  fillOpacity={0.8}
                  stroke={isActive ? '#0b2545' : 'white'}
                  strokeWidth={isActive ? 2.5 : 1}
                  tabIndex={0}
                  role="button"
                  aria-label={`${g.name}, ${FUEL_LABELS[g.fuelType]}, ${g.capacityMw} MW`}
                  onMouseEnter={() => setActive(g)}
                  onFocus={() => setActive(g)}
                  onClick={() => setActive(g)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
        </svg>

        {active && (
          <div className="absolute right-3 top-3 max-w-[16rem] rounded-lg border border-navy-100 bg-white p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: FUEL_COLORS[active.fuelType] }} />
              <p className="font-semibold text-navy-900">{active.name}</p>
            </div>
            <dl className="mt-2 space-y-0.5 text-xs text-navy-700">
              <div className="flex justify-between gap-4"><dt>Fuel</dt><dd>{FUEL_LABELS[active.fuelType]}</dd></div>
              <div className="flex justify-between gap-4"><dt>Capacity</dt><dd>{active.capacityMw} MW</dd></div>
              <div className="flex justify-between gap-4"><dt>Operator</dt><dd className="text-right">{active.operator}</dd></div>
              <div className="flex justify-between gap-4"><dt>Location</dt><dd className="text-right">{active.region}</dd></div>
              {typeof active.modelledOutputMwh === 'number' && (
                <div className="flex justify-between gap-4">
                  <dt>Output <span className="text-amber-700">(est.)</span></dt>
                  <dd>{energy(active.modelledOutputMwh)}</dd>
                </div>
              )}
              {typeof active.attributableWastedMwh === 'number' && active.attributableWastedMwh > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Wasted <span className="text-amber-700">(est.)</span></dt>
                  <dd>{energy(active.attributableWastedMwh)}</dd>
                </div>
              )}
            </dl>
            <p className="mt-2 text-[10px] leading-tight text-navy-400">
              Live output is modelled: system-level fuel generation pro-rated across installed capacity.
            </p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-navy-400">
        EirGrid publishes live fuel mix at system level, not per plant. Per-plant output shown here is an
        estimate. Coordinates/capacities are a curated seed set (EirGrid connected-generators list + OSM).
      </p>
    </div>
  );
}
