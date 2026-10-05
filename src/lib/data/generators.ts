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
  /** Status note shown in the map popup (e.g. reserve-only). */
  note?: string;
  sourceRef: string;
}

/**
 * A curated, partial set of large generators and interconnectors for the map —
 * locations, fuel and capacity only. It is NOT a complete list (Ireland has
 * several hundred wind farms) and carries no output or waste estimates.
 * Coordinates are approximate. Last reviewed October 2026: Moneypoint ended
 * coal burning on 20 June 2025 (oil-fired reserve only, to 2029); the original
 * Tarbert plant closed in 2023; Greenlink (to Wales) entered service in
 * January 2025.
 */
export const GENERATORS: Generator[] = [
  // ---- Gas (thermal) ----
  { id: 'moneypoint', name: 'Moneypoint', fuelType: 'oil', capacityMw: 855, operator: 'ESB', lat: 52.611, lng: -9.406, region: 'Clare', isMajor: true, note: 'Stopped burning coal on 20 June 2025; oil-fired reserve on EirGrid instruction only, until 2029.', sourceRef: 'ESB, June 2025' },
  { id: 'aghada', name: 'Aghada', fuelType: 'gas', capacityMw: 885, operator: 'ESB', lat: 51.827, lng: -8.211, region: 'Cork', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'whitegate', name: 'Whitegate', fuelType: 'gas', capacityMw: 445, operator: 'Bord Gáis Energy', lat: 51.826, lng: -8.230, region: 'Cork', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'poolbeg', name: 'Poolbeg', fuelType: 'gas', capacityMw: 470, operator: 'ESB', lat: 53.339, lng: -6.187, region: 'Dublin', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'huntstown', name: 'Huntstown', fuelType: 'gas', capacityMw: 747, operator: 'Energia', lat: 53.410, lng: -6.320, region: 'Dublin', isMajor: true, sourceRef: 'EirGrid connected generators' },
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
  { id: 'turlough-hill', name: 'Turlough Hill (pumped storage)', fuelType: 'storage', capacityMw: 292, operator: 'ESB', lat: 53.078, lng: -6.336, region: 'Wicklow', isMajor: true, sourceRef: 'EirGrid connected generators' },
  { id: 'erne', name: 'Erne Scheme', fuelType: 'hydro', capacityMw: 65, operator: 'ESB', lat: 54.500, lng: -8.230, region: 'Donegal', isMajor: false, sourceRef: 'EirGrid connected generators' },

  // ---- Interconnection ----
  { id: 'greenlink', name: 'Greenlink Interconnector', fuelType: 'imports', capacityMw: 500, operator: 'Greenlink Interconnector Ltd', lat: 52.236, lng: -6.958, region: 'Wexford (to Wales)', isMajor: true, note: 'In service since January 2025.', sourceRef: 'Greenlink' },
  { id: 'ewic', name: 'East-West Interconnector', fuelType: 'imports', capacityMw: 500, operator: 'EirGrid', lat: 53.480, lng: -6.150, region: 'Dublin (to GB)', isMajor: true, sourceRef: 'EirGrid connected generators' },
];

export const FUEL_LABELS: Record<FuelType, string> = {
  wind: 'Wind',
  solar: 'Solar',
  gas: 'Gas',
  hydro: 'Hydro',
  storage: 'Pumped storage',
  coal: 'Coal',
  oil: 'Oil',
  other: 'Other',
  imports: 'Interconnector',
};

// Brand Book §04: renewables in Grid Green tints (told apart by lightness);
// fossil generation and imports in neutral greys — never red, never orange.
export const FUEL_COLORS: Record<FuelType, string> = {
  wind: '#169B62', // green 500
  solar: '#91D6B1', // green 300
  hydro: '#0A4A2F', // green 800
  storage: '#52BC88', // green 400
  gas: '#6B6F73', // ink 500
  coal: '#2A2C2E', // ink 800
  oil: '#4F5357', // ink 600
  other: '#B5B8BB', // ink 300
  imports: '#8E9296', // ink 400
};
