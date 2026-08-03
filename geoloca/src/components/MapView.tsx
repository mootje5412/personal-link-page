import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const realIcon = new L.DivIcon({
  className: 'real-location-dot',
  html: '<div class="real-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapViewProps {
  center: [number, number];
  marker: [number, number] | null;
  realLocation: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
  onRecenter: () => void;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 0.8 });
  }, [center, map]);
  return null;
}

export default function MapView({
  center,
  marker,
  realLocation,
  onPick,
  onRecenter,
}: MapViewProps) {
  return (
    <MapContainer center={center} zoom={13} zoomControl={false} className="map-view">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onPick} />
      <MapRecenter center={center} />
      {realLocation && (
        <Marker
          position={realLocation}
          icon={realIcon}
          draggable={false}
          eventHandlers={{ click: onRecenter }}
        />
      )}
      {marker && (
        <Marker
          position={marker}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = e.target.getLatLng();
              onPick(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
