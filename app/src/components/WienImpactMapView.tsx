import { useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { GeocodingResult } from '../lib/geocoding';
import { loadWienBezirke, type WienBezirkCollection } from '../lib/geo';
import { defaultMarkerIcon } from '../lib/leafletMarker';
import {
  getHexColor,
  getEhsaClass,
  loadImpactHexes,
  loadImpactLegend,
  type EhsaHexCollection,
  type EhsaHexFeature,
  type ImpactLegend,
} from '../lib/impactHexes';
import type { ImpactSample } from '../types/regulation';
import type { Feature, Polygon } from 'geojson';

const WIEN_CENTER: [number, number] = [48.2082, 16.3738];
const ADDRESS_ZOOM = 15;

interface WienImpactMapViewProps {
  addressMarker: GeocodingResult | null;
  impactSample: ImpactSample | null;
  onHexSelect: (sample: ImpactSample) => void;
}

function FitWienBounds({ data }: { data: WienBezirkCollection }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [16, 16] });
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

interface EhsaHexLayerProps {
  data: EhsaHexCollection;
  legend: ImpactLegend;
  onHexSelect: (sample: ImpactSample) => void;
}

function EhsaHexLayer({ data, legend, onHexSelect }: EhsaHexLayerProps) {
  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        const hexFeature = feature as EhsaHexFeature;
        const fill = getHexColor(hexFeature, legend);
        return {
          fillColor: fill,
          fillOpacity: 0.82,
          color: '#666666',
          weight: 0.5,
        };
      }}
      onEachFeature={(feature, layer) => {
        const hexFeature = feature as EhsaHexFeature;
        layer.on({
          mouseover: (e) => {
            (e.target as L.Path).setStyle({ weight: 1.5 });
          },
          mouseout: (e) => {
            (e.target as L.Path).setStyle({ weight: 0.5 });
          },
          click: () => {
            const { h3 } = hexFeature.properties;
            onHexSelect({
              h3,
              ehsaType: getEhsaClass(hexFeature),
              color: getHexColor(hexFeature, legend),
              geometry: hexFeature.geometry,
            });
          },
        });
      }}
    />
  );
}

function SelectedHexHighlight({ sample }: { sample: ImpactSample }) {
  const feature: Feature<Polygon> = {
    type: 'Feature',
    geometry: sample.geometry,
    properties: {},
  };

  return (
    <GeoJSON
      key={sample.h3}
      data={feature}
      style={{
        fillColor: sample.color,
        fillOpacity: 0.95,
        color: '#1a365d',
        weight: 2.5,
      }}
      interactive={false}
    />
  );
}

function WienBezirkeLayer({ data }: { data: WienBezirkCollection }) {
  return (
    <GeoJSON
      data={data}
      style={{
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#1a365d',
        weight: 1.5,
      }}
      interactive={false}
    />
  );
}

export default function WienImpactMapView({
  addressMarker,
  impactSample,
  onHexSelect,
}: WienImpactMapViewProps) {
  const [bezirkeData, setBezirkeData] = useState<WienBezirkCollection | null>(null);
  const [hexData, setHexData] = useState<EhsaHexCollection | null>(null);
  const [legend, setLegend] = useState<ImpactLegend | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadWienBezirke(), loadImpactHexes(), loadImpactLegend()])
      .then(([bezirke, hexes, legendData]) => {
        setBezirkeData(bezirke);
        setHexData(hexes);
        setLegend(legendData);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  if (loadError) {
    return <div className="map-error">{loadError}</div>;
  }

  if (!bezirkeData || !hexData || !legend) {
    return <div className="map-loading">Impact-Karte wird geladen…</div>;
  }

  return (
    <MapContainer
      center={WIEN_CENTER}
      zoom={11}
      scrollWheelZoom
      className="wien-impact-map"
    >
      <FitWienBounds data={bezirkeData} />
      <FlyToAddress address={addressMarker} />
      <EhsaHexLayer data={hexData} legend={legend} onHexSelect={onHexSelect} />
      {impactSample && <SelectedHexHighlight sample={impactSample} />}
      <WienBezirkeLayer data={bezirkeData} />
      {addressMarker && (
        <Marker
          position={[addressMarker.lat, addressMarker.lng]}
          icon={defaultMarkerIcon}
        />
      )}
    </MapContainer>
  );
}
