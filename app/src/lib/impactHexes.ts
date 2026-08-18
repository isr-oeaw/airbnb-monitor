import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { ImpactSample } from '../types/regulation';

const HEXES_URL = '/data/ehsa_h3_hexes_5class.geojson';
const LEGEND_URL = '/data/ehsa_legend_5class.json';

export interface ImpactLegendEntry {
  color: string;
  label: string;
  description: string;
}

export type ImpactLegend = Record<string, ImpactLegendEntry>;

export interface EhsaHexProperties {
  h3: string;
  ehsa_type: string;
  ehsa_class5: string;
  label?: string;
  description?: string;
  fill: string;
  color: string;
}

export type EhsaHexFeature = Feature<Polygon, EhsaHexProperties>;
export type EhsaHexCollection = FeatureCollection<Polygon, EhsaHexProperties>;

let hexesPromise: Promise<EhsaHexCollection> | null = null;
let legendPromise: Promise<ImpactLegend> | null = null;

export async function loadImpactHexes(): Promise<EhsaHexCollection> {
  if (!hexesPromise) {
    hexesPromise = fetch(HEXES_URL).then((response) => {
      if (!response.ok) {
        throw new Error('EHSA-Hex-Daten konnten nicht geladen werden.');
      }
      return response.json() as Promise<EhsaHexCollection>;
    });
  }
  return hexesPromise;
}

export async function loadImpactLegend(): Promise<ImpactLegend> {
  if (!legendPromise) {
    legendPromise = fetch(LEGEND_URL).then((response) => {
      if (!response.ok) {
        throw new Error('EHSA-Legende konnte nicht geladen werden.');
      }
      return response.json() as Promise<ImpactLegend>;
    });
  }
  return legendPromise;
}

export function getEhsaClass(feature: EhsaHexFeature): string {
  return feature.properties.ehsa_class5 ?? feature.properties.ehsa_type;
}

export function getLegendEntry(
  legend: ImpactLegend,
  type: string,
): ImpactLegendEntry | null {
  return legend[type] ?? null;
}

export function ehsaTypeLabel(type: string, legend?: ImpactLegend | null): string {
  if (legend?.[type]?.label) {
    return legend[type].label;
  }
  return type.replace(/_/g, ' ');
}

export function getHexColor(
  feature: EhsaHexFeature,
  legend: ImpactLegend,
): string {
  return feature.properties.fill
    ?? feature.properties.color
    ?? legend[getEhsaClass(feature)]?.color
    ?? '#dddddd';
}

export function findImpactHexAt(
  collection: EhsaHexCollection,
  legend: ImpactLegend,
  lat: number,
  lng: number,
): ImpactSample | null {
  const pt = point([lng, lat]);

  for (const feature of collection.features) {
    if (!booleanPointInPolygon(pt, feature)) {
      continue;
    }

    const { h3 } = feature.properties;
    const ehsaType = getEhsaClass(feature);
    return {
      h3,
      ehsaType,
      color: getHexColor(feature, legend),
      geometry: feature.geometry,
    };
  }

  return null;
}

export function legendEntries(
  legend: ImpactLegend,
): Array<{ type: string; color: string; label: string; description: string }> {
  return Object.entries(legend).map(([type, entry]) => ({
    type,
    color: entry.color,
    label: entry.label,
    description: entry.description,
  }));
}
