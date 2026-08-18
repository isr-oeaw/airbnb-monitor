import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import BundeslandLayer from './BundeslandLayer';
import {
  findBundeslandAtPoint,
  loadBundeslaender,
  type BundeslandCollection,
  type BundeslandFeature,
} from '../lib/geo';
import type { GeocodingResult } from '../lib/geocoding';
import { defaultMarkerIcon } from '../lib/leafletMarker';
import type { BundeslandId, PanelState } from '../types/regulation';

const AUSTRIA_CENTER: [number, number] = [47.5, 13.5];
const DEFAULT_ZOOM = 7;
const ADDRESS_ZOOM = 14;

interface MapViewProps {
  selectedBundeslandId: BundeslandId | null;
  addressMarker: GeocodingResult | null;
  onBundeslandSelect: (state: PanelState) => void;
  onAddressResolved: (state: PanelState) => void;
}

function FitAustriaBounds({ data }: { data: BundeslandCollection }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    fitted.current = true;
  }, [data, map]);

  return null;
}

function FlyToAddress({ address }: { address: GeocodingResult | null }) {
  const map = useMap();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const key = `${address.lat},${address.lng}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([address.lat, address.lng], ADDRESS_ZOOM, { duration: 1.2 });
  }, [address, map]);

  return null;
}

export default function MapView({
  selectedBundeslandId,
  addressMarker,
  onBundeslandSelect,
  onAddressResolved,
}: MapViewProps) {
  const [geoData, setGeoData] = useState<BundeslandCollection | null>(null);
  const [hoveredId, setHoveredId] = useState<BundeslandId | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const resolvedAddressRef = useRef<string | null>(null);

  useEffect(() => {
    loadBundeslaender()
      .then(setGeoData)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (!geoData || !addressMarker) return;

    const key = `${addressMarker.lat},${addressMarker.lng}`;
    if (resolvedAddressRef.current === key) return;
    resolvedAddressRef.current = key;

    const feature = findBundeslandAtPoint(geoData, addressMarker.lat, addressMarker.lng);
    if (!feature) return;

    onAddressResolved({
      mode: 'address',
      bundeslandId: feature.properties.iso,
      name: feature.properties.name,
      address: addressMarker.label,
      coordinates: [addressMarker.lat, addressMarker.lng],
    });
  }, [addressMarker, geoData, onAddressResolved]);

  const handleBundeslandSelect = (feature: BundeslandFeature) => {
    onBundeslandSelect({
      mode: 'bundesland',
      bundeslandId: feature.properties.iso,
      name: feature.properties.name,
    });
  };

  if (loadError) {
    return <div className="map-error">{loadError}</div>;
  }

  if (!geoData) {
    return <div className="map-loading">Karte wird geladen…</div>;
  }

  return (
    <MapContainer
      center={AUSTRIA_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="austria-map"
    >
      <FitAustriaBounds data={geoData} />
      <FlyToAddress address={addressMarker} />
      <BundeslandLayer
        data={geoData}
        selectedId={selectedBundeslandId}
        hoveredId={hoveredId}
        onSelect={handleBundeslandSelect}
        onHover={setHoveredId}
      />
      {addressMarker && (
        <Marker
          position={[addressMarker.lat, addressMarker.lng]}
          icon={defaultMarkerIcon}
        />
      )}
    </MapContainer>
  );
}
