import { formatCoords } from '../utils/location';
import './LocationPanel.css';

interface LocationPanelProps {
  lat: number | null;
  lng: number | null;
  address: string;
  active: boolean;
  loadingAddress: boolean;
  locating: boolean;
  gpsAvailable: boolean;
  locationSource: 'gps' | 'ip' | null;
  onApply: () => void;
  onStop: () => void;
  onCopy: () => void;
  onUseReal: () => void;
  copied: boolean;
}

export default function LocationPanel({
  lat,
  lng,
  address,
  active,
  loadingAddress,
  locating,
  gpsAvailable,
  locationSource,
  onApply,
  onStop,
  onCopy,
  onUseReal,
  copied,
}: LocationPanelProps) {
  const hasLocation = lat !== null && lng !== null;

  return (
    <section className={`location-panel ${active ? 'is-active' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="panel-label">Selected location</p>
          <h2>
            {active ? 'Spoof active' : hasLocation ? 'Ready to apply' : 'Pick a spot'}
          </h2>
        </div>
        <span className={`status-pill ${active ? 'on' : 'off'}`}>
          {active ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="coords-block">
        {hasLocation ? (
          <>
            <div className="coords-row">
              <p className="coords">{formatCoords(lat, lng)}</p>
              {locationSource && (
                <span className={`source-badge ${locationSource}`}>
                  {locationSource === 'gps' ? 'GPS' : 'Approx'}
                </span>
              )}
            </div>
            <p className="address">{loadingAddress ? 'Looking up address…' : address}</p>
          </>
        ) : (
          <p className="hint">
            Tap the map, search a place, or use the locate button to set your position.
          </p>
        )}
      </div>

      <div className="panel-actions">
        {!active ? (
          <button type="button" className="btn primary" disabled={!hasLocation} onClick={onApply}>
            <span className="btn-icon">◎</span>
            Apply location
          </button>
        ) : (
          <button type="button" className="btn danger" onClick={onStop}>
            <span className="btn-icon">✕</span>
            Stop spoofing
          </button>
        )}
        <button type="button" className="btn secondary" disabled={!hasLocation} onClick={onCopy}>
          {copied ? 'Copied!' : 'Copy coords'}
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={locating}
          onClick={onUseReal}
        >
          {locating ? (
            <>
              <span className="btn-spinner" />
              Finding you…
            </>
          ) : (
            <>
              <span className="btn-icon">⌖</span>
              {gpsAvailable ? 'Use my GPS' : 'Find my location'}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
