import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
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
  userLat?: number | null;
  userLng?: number | null;
  onPick?: (lat: number, lng: number) => void;
};

function MapViewSync({
  lat,
  lng,
  zoom,
  fly,
}: {
  lat: number;
  lng: number;
  zoom: number;
  fly: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (fly) {
      map.flyTo([lat, lng], zoom, { duration: 0.85 });
    } else {
      map.setView([lat, lng], zoom);
    }
  }, [lat, lng, zoom, fly, map]);
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
  zoom = 4,
  interactive = true,
  userLat,
  userLng,
  onPick,
}: RealMapProps) {
  const [fly, setFly] = useState(true);

  useEffect(() => {
    setFly(true);
    const t = window.setTimeout(() => setFly(false), 900);
    return () => window.clearTimeout(t);
  }, [lat, lng, zoom]);

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
        {userLat != null && userLng != null && (
          <CircleMarker
            center={[userLat, userLng]}
            radius={8}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#60a5fa',
              fillOpacity: 0.9,
              weight: 3,
            }}
          />
        )}
        <Marker position={[lat, lng]} icon={pinIcon} />
        <MapViewSync lat={lat} lng={lng} zoom={zoom} fly={fly} />
        <MapClickHandler interactive={interactive} onPick={onPick} />
      </MapContainer>
      <div className="real-map-vignette" aria-hidden />
      {userLat != null && userLng != null && (
        <div className="real-map-you-are-here">Your location</div>
      )}
    </div>
  );
}
