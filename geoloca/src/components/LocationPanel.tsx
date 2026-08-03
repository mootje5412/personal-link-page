import { formatCoords } from '../utils/location';
import './LocationPanel.css';

interface LocationPanelProps {
  lat: number | null;
  lng: number | null;
  address: string;
  active: boolean;
  loadingAddress: boolean;
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
          <h2>{active ? 'Spoof active' : hasLocation ? 'Ready to apply' : 'Tap the map'}</h2>
        </div>
        <span className={`status-pill ${active ? 'on' : 'off'}`}>
          {active ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="coords-block">
        {hasLocation ? (
          <>
            <p className="coords">{formatCoords(lat, lng)}</p>
            <p className="address">{loadingAddress ? 'Looking up address…' : address}</p>
          </>
        ) : (
          <p className="hint">Tap anywhere on the map or search for a place to set your location.</p>
        )}
      </div>

      <div className="panel-actions">
        {!active ? (
          <button type="button" className="btn primary" disabled={!hasLocation} onClick={onApply}>
            Apply location
          </button>
        ) : (
          <button type="button" className="btn danger" onClick={onStop}>
            Stop spoofing
          </button>
        )}
        <button type="button" className="btn secondary" disabled={!hasLocation} onClick={onCopy}>
          {copied ? 'Copied!' : 'Copy coords'}
        </button>
        <button type="button" className="btn ghost" onClick={onUseReal}>
          Use my GPS
        </button>
      </div>
    </section>
  );
}
