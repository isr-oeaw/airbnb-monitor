import type { Feature, FeatureCollection, Polygon } from 'geojson';

const INDICATORS_URL = '/data/h3_indicators_2026Q2.geojson';

export interface H3Indicators {
  h3: string;
  n_listings: number;
  n_hosts: number;
  n_professional_listings: number;
  professional_share: number | null;
  listings_per_host: number | null;
  mean_price: number | null;
  median_price: number | null;
  n_hotels: number;
  listings_per_hotel: number | null;
  quarter: string;
}

export interface IndicatorMaxima {
  n_listings: number;
  n_hosts: number;
  listings_per_host: number;
  median_price: number;
  n_hotels: number;
}

export interface RadarAxis {
  key: string;
  label: string;
  normalized: number;
  raw: number | null;
  format: (value: number | null) => string;
}

interface H3IndicatorProperties {
  h3: string;
  n_listings: number;
  n_hosts: number;
  n_professional_listings: number;
  professional_share: number | null;
  listings_per_host: number | null;
  mean_price: number | null;
  median_price: number | null;
  n_hotels: number;
  listings_per_hotel: number | null;
  quarter: string;
}

type H3IndicatorFeature = Feature<Polygon, H3IndicatorProperties>;
type H3IndicatorCollection = FeatureCollection<Polygon, H3IndicatorProperties>;

export type LoadedIndicators = {
  byH3: Map<string, H3Indicators>;
  maxima: IndicatorMaxima;
};

let indicatorsPromise: Promise<LoadedIndicators> | null = null;

function toIndicators(feature: H3IndicatorFeature): H3Indicators {
  const p = feature.properties;
  return {
    h3: p.h3,
    n_listings: p.n_listings,
    n_hosts: p.n_hosts,
    n_professional_listings: p.n_professional_listings,
    professional_share: p.professional_share,
    listings_per_host: p.listings_per_host,
    mean_price: p.mean_price,
    median_price: p.median_price,
    n_hotels: p.n_hotels,
    listings_per_hotel: p.listings_per_hotel,
    quarter: p.quarter,
  };
}

function computeMaxima(indicators: H3Indicators[]): IndicatorMaxima {
  const max = (values: number[]) => (values.length > 0 ? Math.max(...values) : 1);

  return {
    n_listings: Math.max(1, max(indicators.map((i) => i.n_listings))),
    n_hosts: Math.max(1, max(indicators.map((i) => i.n_hosts))),
    listings_per_host: Math.max(
      1,
      max(indicators.map((i) => i.listings_per_host).filter((v): v is number => v != null)),
    ),
    median_price: Math.max(
      1,
      max(indicators.map((i) => i.median_price).filter((v): v is number => v != null)),
    ),
    n_hotels: Math.max(1, max(indicators.map((i) => i.n_hotels))),
  };
}

function normalize(value: number | null, max: number): number {
  if (value == null || max <= 0) return 0;
  return Math.min(1, value / max);
}

function formatCount(value: number | null): string {
  if (value == null) return '—';
  return String(Math.round(value));
}

function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)} %`;
}

function formatDecimal(value: number | null): string {
  if (value == null) return '—';
  return value.toFixed(1);
}

function formatEuro(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value)} €`;
}

export async function loadH3Indicators(): Promise<LoadedIndicators> {
  if (!indicatorsPromise) {
    indicatorsPromise = fetch(INDICATORS_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error('H3-Kennzahlen konnten nicht geladen werden.');
      }
      const collection = (await response.json()) as H3IndicatorCollection;
      const list = collection.features.map(toIndicators);
      const byH3 = new Map(list.map((item) => [item.h3, item]));
      return {
        byH3,
        maxima: computeMaxima(list),
      };
    });
  }
  return indicatorsPromise;
}

export function getIndicatorsForH3(
  loaded: LoadedIndicators,
  h3: string,
): H3Indicators {
  return loaded.byH3.get(h3) ?? {
    h3,
    n_listings: 0,
    n_hosts: 0,
    n_professional_listings: 0,
    professional_share: null,
    listings_per_host: null,
    mean_price: null,
    median_price: null,
    n_hotels: 0,
    listings_per_hotel: null,
    quarter: '2026Q2',
  };
}

export function getRadarValues(
  indicators: H3Indicators,
  maxima: IndicatorMaxima,
): RadarAxis[] {
  return [
    {
      key: 'n_listings',
      label: 'Listings',
      normalized: normalize(indicators.n_listings, maxima.n_listings),
      raw: indicators.n_listings,
      format: formatCount,
    },
    {
      key: 'n_hosts',
      label: 'Hosts',
      normalized: normalize(indicators.n_hosts, maxima.n_hosts),
      raw: indicators.n_hosts,
      format: formatCount,
    },
    {
      key: 'professional_share',
      label: 'Prof.-Anteil',
      normalized: indicators.professional_share ?? 0,
      raw: indicators.professional_share,
      format: formatPercent,
    },
    {
      key: 'listings_per_host',
      label: 'List./Host',
      normalized: normalize(indicators.listings_per_host, maxima.listings_per_host),
      raw: indicators.listings_per_host,
      format: formatDecimal,
    },
    {
      key: 'median_price',
      label: 'Medianpreis',
      normalized: normalize(indicators.median_price, maxima.median_price),
      raw: indicators.median_price,
      format: formatEuro,
    },
    {
      key: 'n_hotels',
      label: 'Hotels',
      normalized: normalize(indicators.n_hotels, maxima.n_hotels),
      raw: indicators.n_hotels,
      format: formatCount,
    },
  ];
}

export function hasListingActivity(indicators: H3Indicators): boolean {
  return indicators.n_listings > 0;
}
