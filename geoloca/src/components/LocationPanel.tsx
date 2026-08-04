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
      <div className="panel-top">
        <div className="panel-status">
          <span className={`dot ${active ? 'live' : ''}`} />
          <span>{active ? 'Using fake spot' : 'Not active'}</span>
        </div>
        {locationSource && hasLocation && (
          <span className="source-tag">{locationSource === 'gps' ? 'GPS' : 'Network'}</span>
        )}
      </div>

      {hasLocation ? (
        <div className="location-info">
          <p className="coords">{formatCoords(lat, lng)}</p>
          <p className="address">{loadingAddress ? 'Getting address…' : address}</p>
        </div>
      ) : (
        <p className="empty-hint">Tap the map or search somewhere</p>
      )}

      <p className="scope-line">Only affects this app — not Snap, Google Maps, etc.</p>

      <div className="actions">
        {!active ? (
          <button type="button" className="btn main" disabled={!hasLocation} onClick={onApply}>
            Use this location
          </button>
        ) : (
          <button type="button" className="btn stop" onClick={onStop}>
            Turn off
          </button>
        )}
        <div className="actions-row">
          <button type="button" className="btn subtle" disabled={!hasLocation} onClick={onCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn subtle" disabled={locating} onClick={onUseReal}>
            {locating ? 'Finding…' : gpsAvailable ? 'My GPS' : 'Find me'}
          </button>
        </div>
      </div>
    </section>
  );
}
