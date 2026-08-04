import { useCallback, useEffect, useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { MAP_SPOTS } from '../data/mapSpots';
import type { AppliedLocation } from '../hooks/usePhoneConnection';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { useLanguage } from '../i18n/LanguageContext';
import { countryCoords } from '../utils/countryCoords';
import PhoneConnection from './PhoneConnection';
import RealMap from './RealMap';
import './DashboardMap.css';

type Country = (typeof COUNTRIES)[number];

type SearchResult = {
  name: string;
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  connectedDevice: DetectedDevice | null;
  appliedLocation: AppliedLocation | null;
  applyingLocation: boolean;
  linkOnline: boolean;
  needsLink: boolean;
  scanHints: string[];
  onDisconnect: () => void;
  onConnect: () => void;
  onDownloadLink: () => void;
  onApplyLocation: (country: string, lat: number, lng: number, label: string) => void;
};

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('addressdetails', '0');
    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'GeoLoca/1.0 (https://geoloca.eu)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return data.map((item) => ({
      name: item.display_name.split(',')[0],
      lat: Number(item.lat),
      lng: Number(item.lon),
      label: item.display_name,
    }));
  } catch {
    return [];
  }
}

export default function DashboardMap({
  connected,
  connectionStatus,
  connectedDevice,
  appliedLocation,
  applyingLocation,
  linkOnline,
  needsLink,
  scanHints,
  onDisconnect,
  onConnect,
  onDownloadLink,
  onApplyLocation,
}: Props) {
  const { t } = useLanguage();
  const [country, setCountry] = useState<Country>('Netherlands');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showPhonePanel, setShowPhonePanel] = useState(false);
  const [mapZoom, setMapZoom] = useState(4);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [pin, setPin] = useState(() => {
    const c = countryCoords('Netherlands');
    return { lat: c.lat, lng: c.lng, label: 'Netherlands' };
  });

  const spot = MAP_SPOTS[country];

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* keep default pin */
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    const c = countryCoords(country);
    setPin({ lat: c.lat, lng: c.lng, label: country });
    setMapZoom(5);
  }, [country]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchPlaces(query).then(setSearchResults);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 8);
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const pickCountry = (c: Country) => {
    setCountry(c);
    setQuery('');
    setSearchResults([]);
  };

  const pickSearch = (result: SearchResult) => {
    setPin({ lat: result.lat, lng: result.lng, label: result.name });
    setQuery('');
    setSearchResults([]);
    setMapZoom(8);
  };

  const handleMapPick = useCallback(
    (lat: number, lng: number) => {
      if (!connected) {
        setShowPhonePanel(true);
        return;
      }
      setPin({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setMapZoom(8);
    },
    [connected],
  );

  const handleApply = () => {
    if (!connected) {
      setShowPhonePanel(true);
      return;
    }
    onApplyLocation(pin.label, pin.lat, pin.lng, `${pin.lat.toFixed(3)}°, ${pin.lng.toFixed(3)}°`);
  };

  const statusLabel = connected
    ? connectedDevice
      ? t('conn.success_name', { name: connectedDevice.name })
      : t('conn.success')
    : connectionStatus === 'detecting_usb' || connectionStatus === 'connecting'
      ? t('conn.scanning')
      : t('conn.waiting');

  return (
    <div className="dash-map">
      <RealMap
        lat={pin.lat}
        lng={pin.lng}
        zoom={mapZoom}
        interactive={connected}
        userLat={userPos?.lat ?? null}
        userLng={userPos?.lng ?? null}
        onPick={handleMapPick}
      />

      <button
        type="button"
        className={`dash-map-conn ${connectionStatus}`}
        onClick={() => setShowPhonePanel(true)}
        aria-label="iPhone USB connection"
      >
        <span className="dash-map-conn-dot" aria-hidden />
        {connected && <span className="dash-map-conn-usb">{t('conn.usb')}</span>}
        {statusLabel}
      </button>

      <div className="dash-map-toolbar">
        <label className="dash-map-search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('map.search')}
            aria-label={t('map.search')}
            disabled={!connected}
          />
        </label>
        <div className="dash-map-zoom">
          <button type="button" className="map-ctrl" onClick={() => setMapZoom((z) => Math.min(z + 1, 18))} disabled={!connected}>+</button>
          <button type="button" className="map-ctrl" onClick={() => setMapZoom((z) => Math.max(z - 1, 2))} disabled={!connected}>−</button>
        </div>
      </div>

      {query && (searchResults.length > 0 || filteredCountries.length > 0) && (
        <ul className="dash-map-results">
          {searchResults.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button type="button" onClick={() => pickSearch(r)} disabled={!connected}>
                {r.label}
              </button>
            </li>
          ))}
          {searchResults.length === 0 &&
            filteredCountries.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => pickCountry(c)} disabled={!connected}>
                  {c}
                </button>
              </li>
            ))}
        </ul>
      )}

      {applyingLocation && (
        <div className="dash-map-spoof-badge dash-map-spoof-badge--applying">
          <span className="dash-map-spoof-spinner" aria-hidden />
          {t('map.applying')}
        </div>
      )}

      {appliedLocation && connected && !applyingLocation && (
        <div className="dash-map-spoof-badge">
          <span className="dash-map-spoof-dot" />
          {t('map.changed', { country: appliedLocation.country })}
          <span className="dash-map-spoof-device"> · {appliedLocation.label}</span>
        </div>
      )}

      <div className="dash-map-countries">
        {COUNTRIES.slice(0, 8).map((c) => (
          <button
            key={c}
            type="button"
            className={`dash-map-tag ${country === c ? 'active' : ''}`}
            onClick={() => pickCountry(c)}
            disabled={!connected}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="dash-map-coords">
        <span>{spot.lat}</span>
        <span>·</span>
        <span>{spot.lng}</span>
      </div>

      <div className="dash-map-location-bar">
        <div className="dash-map-location-text">
          <span className="dash-map-location-label">{t('map.selected')}</span>
          <strong>{pin.label}</strong>
          {connected && connectedDevice && (
            <span className="dash-map-location-device">
              {t('map.via_usb', { device: connectedDevice.name })}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`btn btn-primary dash-map-apply ${connected ? 'ready' : ''}`}
          onClick={handleApply}
          disabled={applyingLocation}
        >
          {applyingLocation
            ? t('map.updating')
            : connected
              ? t('map.change_location')
              : t('map.connect_first')}
        </button>
      </div>

      <PhoneConnection
        status={connectionStatus}
        connectedDevice={connectedDevice}
        linkOnline={linkOnline}
        needsLink={needsLink}
        scanHints={scanHints}
        onDisconnect={() => {
          onDisconnect();
          setShowPhonePanel(true);
        }}
        onConnect={onConnect}
        onDownloadLink={onDownloadLink}
        open={!connected || showPhonePanel}
        onClose={connected ? () => setShowPhonePanel(false) : undefined}
      />
    </div>
  );
}
