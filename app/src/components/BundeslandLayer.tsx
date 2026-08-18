import { useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { LeafletMouseEvent, Path } from 'leaflet';
import type { PathOptions } from 'leaflet';
import type { BundeslandCollection, BundeslandFeature } from '../lib/geo';
import type { BundeslandId } from '../types/regulation';

const BASE_STYLE: PathOptions = {
  fillColor: '#6b9bd1',
  fillOpacity: 0.55,
  color: '#2c5282',
  weight: 1.5,
};

const HOVER_STYLE: PathOptions = {
  fillColor: '#4299e1',
  fillOpacity: 0.75,
  color: '#2b6cb0',
  weight: 2,
};

const SELECTED_STYLE: PathOptions = {
  fillColor: '#3182ce',
  fillOpacity: 0.85,
  color: '#1a365d',
  weight: 2.5,
};

interface BundeslandLayerProps {
  data: BundeslandCollection;
  selectedId: BundeslandId | null;
  hoveredId: BundeslandId | null;
  onSelect: (feature: BundeslandFeature) => void;
  onHover: (id: BundeslandId | null) => void;
}

function styleForId(
  id: BundeslandId,
  selectedId: BundeslandId | null,
  hoveredId: BundeslandId | null,
): PathOptions {
  if (id === selectedId) return SELECTED_STYLE;
  if (id === hoveredId) return HOVER_STYLE;
  return BASE_STYLE;
}

export default function BundeslandLayer({
  data,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: BundeslandLayerProps) {
  const layersRef = useRef<Map<BundeslandId, Path>>(new Map());

  useEffect(() => {
    layersRef.current.forEach((layer, id) => {
      layer.setStyle(styleForId(id, selectedId, hoveredId));
    });
  }, [selectedId, hoveredId]);

  return (
    <GeoJSON
      data={data}
      style={(feature) =>
        styleForId(
          (feature as BundeslandFeature).properties.iso,
          selectedId,
          hoveredId,
        )
      }
      onEachFeature={(feature, layer) => {
        const bundeslandFeature = feature as BundeslandFeature;
        const id = bundeslandFeature.properties.iso;
        layersRef.current.set(id, layer as Path);

        layer.on({
          click: (e: LeafletMouseEvent) => {
            e.originalEvent.stopPropagation();
            onSelect(bundeslandFeature);
          },
          mouseover: () => onHover(id),
          mouseout: () => onHover(null),
        });
      }}
    />
  );
}
