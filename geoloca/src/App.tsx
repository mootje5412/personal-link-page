import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import LocationPanel from './components/LocationPanel';
import InstallPrompt from './components/InstallPrompt';
import {
  loadSpoofState,
  reverseGeocode,
  saveSpoofState,
  type SavedLocation,
} from './utils/location';
import { applyGeolocationSpoof, getRealPosition } from './utils/geolocationSpoof';
import './App.css';

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

export default function App() {
  const saved = loadSpoofState();
  const [center, setCenter] = useState<[number, number]>(
    saved.location ? [saved.location.lat, saved.location.lng] : DEFAULT_CENTER
  );
  const [picked, setPicked] = useState<SavedLocation | null>(saved.location);
  const [realLocation, setRealLocation] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState(saved.location?.address ?? '');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [active, setActive] = useState(saved.active);
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    applyGeolocationSpoof(active, picked);
    saveSpoofState({ active, location: picked });
  }, [active, picked]);

  const updateLocation = useCallback(async (lat: number, lng: number, label?: string) => {
    setPicked({ lat, lng, label: label ?? 'Custom pin', address: undefined });
    setCenter([lat, lng]);
    setLoadingAddress(true);
    const resolved = await reverseGeocode(lat, lng);
    setAddress(resolved);
    setPicked((prev) =>
      prev ? { ...prev, address: resolved, label: label ?? prev.label } : prev
    );
    setLoadingAddress(false);
  }, []);

  useEffect(() => {
    getRealPosition()
      .then((pos) => {
        setRealLocation([pos.lat, pos.lng]);
        if (!saved.location) {
          setCenter([pos.lat, pos.lng]);
        }
      })
      .catch(() => {
        /* GPS unavailable — keep default map center */
      });
  }, [saved.location]);

  const marker = useMemo<[number, number] | null>(() => {
    if (!picked) return null;
    return [picked.lat, picked.lng];
  }, [picked]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden>
            ◎
          </span>
          <div>
            <h1>Geoloca</h1>
            <p>Location changer</p>
          </div>
        </div>
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
        >
          {panelOpen ? 'Hide' : 'Show'}
        </button>
      </header>

      <div className="map-shell">
        <MapView
          center={center}
          marker={marker}
          realLocation={realLocation}
          onPick={(lat, lng) => updateLocation(lat, lng)}
          onRecenter={() => picked && setCenter([picked.lat, picked.lng])}
        />
      </div>

      <div className={`bottom-sheet ${panelOpen ? 'open' : 'closed'}`}>
        <SearchBar
          onSelect={(result) => updateLocation(result.lat, result.lng, result.label)}
        />
        <LocationPanel
          lat={picked?.lat ?? null}
          lng={picked?.lng ?? null}
          address={address}
          active={active}
          loadingAddress={loadingAddress}
          copied={copied}
          onApply={() => setActive(true)}
          onStop={() => setActive(false)}
          onCopy={async () => {
            if (!picked) return;
            await navigator.clipboard.writeText(`${picked.lat}, ${picked.lng}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }}
          onUseReal={async () => {
            try {
              const pos = await getRealPosition();
              setRealLocation([pos.lat, pos.lng]);
              await updateLocation(pos.lat, pos.lng, 'My GPS location');
              setActive(false);
            } catch {
              setAddress('Could not access GPS. Allow location permission and try again.');
            }
          }}
        />
        <p className="footer-note">
          Tap the map to place your pin, then tap Apply. Install to Home Screen for one-tap access.
        </p>
      </div>

      <InstallPrompt />
    </div>
  );
}
