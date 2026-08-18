export type BundeslandId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface RegulationSource {
  label: string;
  url: string;
}

export interface BundeslandRegulation {
  name: string;
  regulationSummary: string;
  keyRules: string[];
  airbnbImpact: string;
  sources: RegulationSource[];
  lastUpdated: string;
}

export type BundeslandRegulations = Record<BundeslandId, BundeslandRegulation>;

export interface GeoJsonFeatureProperties {
  name: string;
  iso: BundeslandId;
}

export interface PanelStateBundesland {
  mode: 'bundesland';
  bundeslandId: BundeslandId;
  name: string;
}

export interface PanelStateAddress {
  mode: 'address';
  bundeslandId: BundeslandId;
  name: string;
  address: string;
  coordinates: [number, number];
}

export type PanelState = PanelStateBundesland | PanelStateAddress | PanelStateImpactError | null;

export type ViewMode = 'regulation' | 'impact';

export interface ImpactSample {
  h3: string;
  ehsaType: string;
  color: string;
  geometry: import('geojson').Polygon;
  address?: string;
  coordinates?: [number, number];
}

export interface PanelStateImpactError {
  mode: 'impact-error';
  message: string;
}
