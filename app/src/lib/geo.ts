import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { BundeslandId, GeoJsonFeatureProperties } from '../types/regulation';

export type BundeslandFeature = Feature<Polygon | MultiPolygon, GeoJsonFeatureProperties>;
export type BundeslandCollection = FeatureCollection<Polygon | MultiPolygon, GeoJsonFeatureProperties>;

export async function loadBundeslaender(): Promise<BundeslandCollection> {
  const response = await fetch('/data/austria-bundeslaender.geojson');
  if (!response.ok) {
    throw new Error('Bundesländer-Grenzen konnten nicht geladen werden.');
  }
  return response.json() as Promise<BundeslandCollection>;
}

export function findBundeslandAtPoint(
  collection: BundeslandCollection,
  lat: number,
  lng: number,
): BundeslandFeature | null {
  const pt = point([lng, lat]);

  for (const feature of collection.features) {
    if (booleanPointInPolygon(pt, feature)) {
      return feature;
    }
  }

  return null;
}

export function getBundeslandId(feature: BundeslandFeature): BundeslandId {
  return feature.properties.iso;
}

export function getWienFeature(collection: BundeslandCollection): BundeslandFeature | null {
  return collection.features.find((f) => f.properties.iso === '9') ?? null;
}

export const WIEN_BUNDESLAND_ID: BundeslandId = '9';

const WIEN_BEZIRKE_URL = '/data/wien-bezirke.geojson';

export interface WienBezirkProperties {
  BEZNR?: number;
  NAMEK?: string;
  NAMEG?: string;
  BEZ?: string;
  [key: string]: unknown;
}

export type WienBezirkFeature = Feature<Polygon | MultiPolygon, WienBezirkProperties>;
export type WienBezirkCollection = FeatureCollection<Polygon | MultiPolygon, WienBezirkProperties>;

let bezirkePromise: Promise<WienBezirkCollection> | null = null;

export async function loadWienBezirke(): Promise<WienBezirkCollection> {
  if (!bezirkePromise) {
    bezirkePromise = fetch(WIEN_BEZIRKE_URL).then((response) => {
      if (!response.ok) {
        throw new Error('Wiener Bezirksgrenzen konnten nicht geladen werden.');
      }
      return response.json() as Promise<WienBezirkCollection>;
    });
  }
  return bezirkePromise;
}
