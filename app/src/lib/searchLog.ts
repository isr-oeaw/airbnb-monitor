const CONSENT_STORAGE_KEY = 'airbnb-monitor-datenschutz-consent';

export function getDatenschutzConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDatenschutzConsent(consented: boolean): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, consented ? 'true' : 'false');
  } catch {
    // Ignore storage errors (private browsing, etc.)
  }
}

export interface SearchLogPayload {
  address: string;
  lat: number;
  lng: number;
  viewMode: string;
  timestamp: string;
}

export function logAddressSearch(
  result: { label: string; lat: number; lng: number },
  viewMode: string,
): void {
  if (!getDatenschutzConsent()) {
    return;
  }

  const payload: SearchLogPayload = {
    address: result.label,
    lat: result.lat,
    lng: result.lng,
    viewMode,
    timestamp: new Date().toISOString(),
  };

  void fetch('/api/search-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Fire-and-forget: logging must not affect search UX
  });
}
