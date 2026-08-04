import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RealMap.css';

const pinIcon = L.divIcon({
  className: 'real-map-pin',
  html: '<span class="real-map-pin-inner"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

type RealMapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
  onPick?: (lat: number, lng: number) => void;
};

function MapViewSync({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.85 });
  }, [lat, lng, zoom, map]);
  return null;
}

function MapClickHandler({
  interactive,
  onPick,
}: {
  interactive: boolean;
  onPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!interactive || !onPick) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RealMap({
  lat,
  lng,
  zoom = 3,
  interactive = true,
  onPick,
}: RealMapProps) {
  return (
    <div className="real-map-wrap">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        minZoom={2}
        maxZoom={18}
        className="real-map"
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          attribution=""
          subdomains="abcd"
          maxZoom={20}
          pane="overlayPane"
          opacity={0.85}
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
        <MapViewSync lat={lat} lng={lng} zoom={zoom} />
        <MapClickHandler interactive={interactive} onPick={onPick} />
      </MapContainer>
      <div className="real-map-vignette" aria-hidden />
    </div>
  );
}
