import type { FuelType } from '../methodology/types';

export interface Generator {
  id: string;
  name: string;
  fuelType: FuelType;
  capacityMw: number;
  operator: string;
  lat: number;
  lng: number;
  region: string;
  isMajor: boolean;
  commissionedYear?: number;
  sourceRef: string;
}

/**
 * Curated generator set for the map (§5.1, §6). `isMajor` sites form the clean
 * default view; the full set loads behind "Open detailed map".
 *
 * SEED DATA — approximate coordinates/capacities for a representative set of the
 * Republic's largest/most representative generators. In production this table is
 * populated from EirGrid's "List of Connected & Contracted Generators" joined to
 * OpenStreetMap `power=plant/generator` for coordinates, imported via /admin.
 */
export const GENERATORS: Generator[] = [
  // ---- Gas (thermal) ----
  { id: 'moneypoint', name: 'Moneypoint', fuelType: 'coal', capacityMw: 855, operator: 'ESB', lat: 52.611, lng: -9.406, region: 'Clare', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'aghada', name: 'Aghada', fuelType: 'gas', capacityMw: 885, operator: 'ESB', lat: 51.827, lng: -8.211, region: 'Cork', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'whitegate', name: 'Whitegate', fuelType: 'gas', capacityMw: 445, operator: 'Bord Gáis Energy', lat: 51.826, lng: -8.230, region: 'Cork', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'poolbeg', name: 'Poolbeg', fuelType: 'gas', capacityMw: 470, operator: 'ESB', lat: 53.339, lng: -6.187, region: 'Dublin', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'huntstown', name: 'Huntstown', fuelType: 'gas', capacityMw: 747, operator: 'Energia', lat: 53.410, lng: -6.320, region: 'Dublin', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'tarbert', name: 'Tarbert', fuelType: 'oil', capacityMw: 590, operator: 'ESB', lat: 52.573, lng: -9.375, region: 'Kerry', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'great-island', name: 'Great Island', fuelType: 'gas', capacityMw: 464, operator: 'SSE', lat: 52.238, lng: -6.951, region: 'Wexford', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'dublin-bay', name: 'Dublin Bay Power', fuelType: 'gas', capacityMw: 415, operator: 'Synergen', lat: 53.339, lng: -6.190, region: 'Dublin', isMajor: false, sourceRef: 'EirGrid connected generators' },

  // ---- Wind (onshore) ----
  { id: 'galway-wind-park', name: 'Galway Wind Park', fuelType: 'wind', capacityMw: 174, operator: 'SSE / Coillte', lat: 53.293, lng: -9.470, region: 'Galway', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'oweninny', name: 'Oweninny Wind Farm', fuelType: 'wind', capacityMw: 172, operator: 'ESB / Bord na Móna', lat: 54.045, lng: -9.560, region: 'Mayo', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'meenadreen', name: 'Meenadreen Wind Farm', fuelType: 'wind', capacityMw: 108, operator: 'Energia', lat: 54.760, lng: -8.150, region: 'Donegal', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'mount-lucas', name: 'Mount Lucas Wind Farm', fuelType: 'wind', capacityMw: 84, operator: 'Bord na Móna', lat: 53.290, lng: -7.220, region: 'Offaly', isMajor: false, sourceRef: 'EirGrid connected generators' },
  { id: 'knockacummer', name: 'Knockacummer Wind Farm', fuelType: 'wind', capacityMw: 100, operator: 'Ligar', lat: 52.170, lng: -9.170, region: 'Cork', isMajor: false, sourceRef: 'EirGrid connected generators' },
  { id: 'sliabh-bawn', name: 'Sliabh Bawn Wind Farm', fuelType: 'wind', capacityMw: 64, operator: 'Bord na Móna / Coillte', lat: 53.700, lng: -8.020, region: 'Roscommon', isMajor: false, sourceRef: 'EirGrid connected generators' },

  // ---- Wind (offshore) ----
  { id: 'arklow-bank', name: 'Arklow Bank', fuelType: 'wind', capacityMw: 25, operator: 'SSE Renewables', lat: 52.800, lng: -5.900, region: 'Offshore (Wicklow)', isMajor: true, sourceRef: 'EirGrid connected generators' },

  // ---- Solar ----
  { id: 'millvale', name: 'Millvale Solar Farm', fuelType: 'solar', capacityMw: 40, operator: 'Statkraft', lat: 52.850, lng: -6.700, region: 'Wicklow', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'gorey-solar', name: 'Gorey Solar Farm', fuelType: 'solar', capacityMw: 35, operator: 'NTR', lat: 52.674, lng: -6.293, region: 'Wexford', isMajor: false, sourceRef: 'EirGrid connected generators' },

  // ---- Hydro ----
  { id: 'ardnacrusha', name: 'Ardnacrusha', fuelType: 'hydro', capacityMw: 86, operator: 'ESB', lat: 52.706, lng: -8.605, region: 'Clare', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'turlough-hill', name: 'Turlough Hill (pumped storage)', fuelType: 'hydro', capacityMw: 292, operator: 'ESB', lat: 53.078, lng: -6.336, region: 'Wicklow', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'erne', name: 'Erne Scheme', fuelType: 'hydro', capacityMw: 65, operator: 'ESB', lat: 54.500, lng: -8.230, region: 'Donegal', isMajor: false, sourceRef: 'EirGrid connected generators' },

  // ---- Interconnection ----
  { id: 'ewic', name: 'East-West Interconnector', fuelType: 'imports', capacityMw: 500, operator: 'EirGrid', lat: 53.480, lng: -6.150, region: 'Dublin (to GB)', isMajor: true, sourceRef: 'EirGrid connected generators' },
];

export const FUEL_LABELS: Record<FuelType, string> = {
  wind: 'Wind',
  solar: 'Solar',
  gas: 'Gas',
  hydro: 'Hydro',
  coal: 'Coal',
  oil: 'Oil',
  other: 'Other',
  imports: 'Imports',
};

export const FUEL_COLORS: Record<FuelType, string> = {
  wind: '#2b9fd6',
  solar: '#f2b705',
  gas: '#e06d3b',
  hydro: '#3bb2a0',
  coal: '#4a4a4a',
  oil: '#8a5a44',
  other: '#8a8f98',
  imports: '#7d6bb0',
};
