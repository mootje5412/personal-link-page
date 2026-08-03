import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import LocationPanel from './components/LocationPanel';
import InstallPrompt from './components/InstallPrompt';
import Toast, { type ToastType } from './components/Toast';
import {
  loadSpoofState,
  reverseGeocode,
  saveSpoofState,
  type SavedLocation,
} from './utils/location';
import {
  applyGeolocationSpoof,
  getRealPosition,
  isGpsAvailable,
} from './utils/geolocationSpoof';
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
  const [locating, setLocating] = useState(false);
  const [active, setActive] = useState(saved.active);
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

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

  const handleFindLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getRealPosition();
      setRealLocation([pos.lat, pos.lng]);
      setLocationSource(pos.source);
      await updateLocation(pos.lat, pos.lng, pos.label ?? 'My location');
      setActive(false);

      if (pos.source === 'gps') {
        showToast('GPS location found', 'success');
      } else {
        showToast('Using approximate location (GPS needs HTTPS)', 'info');
      }
    } catch {
      showToast('Could not detect your location. Tap the map instead.', 'error');
    } finally {
      setLocating(false);
    }
  }, [showToast, updateLocation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pos = await getRealPosition();
        if (cancelled) return;
        setRealLocation([pos.lat, pos.lng]);
        setLocationSource(pos.source);
        if (!saved.location) {
          await updateLocation(pos.lat, pos.lng, pos.label ?? 'My location');
        }
      } catch {
        /* keep default map center */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [saved.location, updateLocation]);

  const marker = useMemo<[number, number] | null>(() => {
    if (!picked) return null;
    return [picked.lat, picked.lng];
  }, [picked]);

  return (
    <div className="app">
      <div className="app-bg" aria-hidden />

      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
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
          {panelOpen ? 'Hide' : 'Panel'}
        </button>
      </header>

      <div className="map-shell">
        <MapView
          center={center}
          marker={marker}
          realLocation={realLocation}
          onPick={(lat, lng) => updateLocation(lat, lng)}
          onLocate={handleFindLocation}
          locating={locating}
        />
      </div>

      <div className={`bottom-sheet ${panelOpen ? 'open' : 'closed'}`}>
        <div className="sheet-handle" aria-hidden />
        <SearchBar
          onSelect={(result) => updateLocation(result.lat, result.lng, result.label)}
        />
        <LocationPanel
          lat={picked?.lat ?? null}
          lng={picked?.lng ?? null}
          address={address}
          active={active}
          loadingAddress={loadingAddress}
          locating={locating}
          gpsAvailable={isGpsAvailable()}
          locationSource={locationSource}
          copied={copied}
          onApply={() => {
            setActive(true);
            showToast('Location spoof is now active', 'success');
          }}
          onStop={() => {
            setActive(false);
            showToast('Spoofing stopped', 'info');
          }}
          onCopy={async () => {
            if (!picked) return;
            await navigator.clipboard.writeText(`${picked.lat}, ${picked.lng}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }}
          onUseReal={handleFindLocation}
        />
      </div>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
      <InstallPrompt />
    </div>
  );
}
