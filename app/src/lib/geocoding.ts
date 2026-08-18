const PHOTON_API = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE_API = 'https://photon.komoot.io/reverse';
const AUSTRIA_BBOX = '9.5,46.4,17.2,49.0';
const PHOTON_FETCH_LIMIT = '10';
const RESULT_LIMIT = 5;

export interface GeocodingResult {
  label: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function isAustrianFeature(feature: PhotonFeature): boolean {
  const { countrycode, country } = feature.properties;

  if (countrycode?.toUpperCase() === 'AT') {
    return true;
  }

  if (country) {
    const normalized = country.toLowerCase();
    return normalized === 'austria' || normalized === 'österreich';
  }

  return false;
}

function formatAddress(feature: PhotonFeature): string {
  const { name, street, housenumber, postcode, city, state } = feature.properties;
  const streetPart = street
    ? `${street}${housenumber ? ` ${housenumber}` : ''}`
    : name ?? '';
  const locality = [postcode, city].filter(Boolean).join(' ');
  const parts = [streetPart, locality, state].filter(Boolean);
  return parts.join(', ');
}

function mapFeature(feature: PhotonFeature): GeocodingResult {
  const [lng, lat] = feature.geometry.coordinates;
  return {
    label: formatAddress(feature),
    lat,
    lng,
  };
}

export async function searchAddresses(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    bbox: AUSTRIA_BBOX,
    lang: 'de',
    limit: PHOTON_FETCH_LIMIT,
  });

  const response = await fetch(`${PHOTON_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Adresssuche fehlgeschlagen.');
  }

  const data = (await response.json()) as PhotonResponse;
  return data.features
    .filter(isAustrianFeature)
    .map(mapFeature)
    .filter((r) => r.label.length > 0)
    .slice(0, RESULT_LIMIT);
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: 'de',
  });

  const response = await fetch(`${PHOTON_REVERSE_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Adresssuche fehlgeschlagen.');
  }

  const data = (await response.json()) as PhotonResponse;
  const feature = data.features.find(isAustrianFeature);
  if (!feature) {
    return null;
  }

  const result = mapFeature(feature);
  if (result.label.length === 0) {
    return null;
  }

  return {
    ...result,
    lat,
    lng,
  };
}
