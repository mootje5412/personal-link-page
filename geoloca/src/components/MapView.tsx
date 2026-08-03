import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import './MapView.css';

const pinIcon = new L.DivIcon({
  className: 'custom-pin-wrap',
  html: '<div class="custom-pin"><div class="custom-pin-dot"></div></div>',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

const realIcon = new L.DivIcon({
  className: 'real-location-dot',
  html: '<div class="real-dot"><span></span></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapViewProps {
  center: [number, number];
  marker: [number, number] | null;
  realLocation: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
  onLocate: () => void;
  locating: boolean;
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
    map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.85 });
  }, [center, map]);
  return null;
}

export default function MapView({
  center,
  marker,
  realLocation,
  onPick,
  onLocate,
  locating,
}: MapViewProps) {
  return (
    <div className="map-view-wrap">
      <MapContainer center={center} zoom={14} zoomControl={false} className="map-view">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomleft" />
        <MapClickHandler onPick={onPick} />
        <MapRecenter center={center} />
        {realLocation && (
          <Marker position={realLocation} icon={realIcon} interactive={false} />
        )}
        {marker && (
          <Marker
            position={marker}
            icon={pinIcon}
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

      <button
        type="button"
        className={`map-locate-btn ${locating ? 'loading' : ''}`}
        onClick={onLocate}
        aria-label="Find my location"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
