import { useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { MAP_SPOTS } from '../data/mapSpots';
import type { ConnectionStatus, PhoneDevice } from '../data/phones';
import PhoneConnection from './PhoneConnection';
import './DashboardMap.css';

type Country = (typeof COUNTRIES)[number];

type Props = {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  selectedPhone: PhoneDevice | null;
  connectedPhone: PhoneDevice | null;
  appliedCountry: string | null;
  phones: PhoneDevice[];
  onSelectPhone: (phone: PhoneDevice) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onApplyLocation: (country: Country) => void;
};

export default function DashboardMap({
  connected,
  connectionStatus,
  selectedPhone,
  connectedPhone,
  appliedCountry,
  phones,
  onSelectPhone,
  onConnect,
  onDisconnect,
  onApplyLocation,
}: Props) {
  const [country, setCountry] = useState<Country>('Netherlands');
  const [query, setQuery] = useState('');
  const [showPhonePanel, setShowPhonePanel] = useState(false);
  const spot = MAP_SPOTS[country];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const pick = (c: Country) => {
    setCountry(c);
    setQuery('');
  };

  const handleApply = () => {
    if (!connected) {
      setShowPhonePanel(true);
      return;
    }
    onApplyLocation(country);
  };

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Successfully connected'
      : connectionStatus === 'connecting'
        ? 'Connecting…'
        : 'Waiting to be connected';

  return (
    <div className="dash-map">
      <button
        type="button"
        className={`dash-map-conn ${connectionStatus}`}
        onClick={() => setShowPhonePanel(true)}
        aria-label="Phone connection status"
      >
        <span className="dash-map-conn-dot" aria-hidden />
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
            placeholder="Search country…"
            aria-label="Search country"
            disabled={!connected}
          />
        </label>
        <span className="dash-map-layer">Satellite</span>
      </div>

      {query && filtered.length > 0 && (
        <ul className="dash-map-results">
          {filtered.slice(0, 6).map((c) => (
            <li key={c}>
              <button type="button" onClick={() => pick(c)} disabled={!connected}>
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      <svg className="dash-map-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="dash-map-water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#12161f" />
            <stop offset="100%" stopColor="#0a0d14" />
          </linearGradient>
          <linearGradient id="dash-map-land" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a3140" />
            <stop offset="100%" stopColor="#1c222d" />
          </linearGradient>
          <radialGradient id="dash-map-glow">
            <stop offset="0%" stopColor="rgba(99,102,241,0.28)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
          <pattern id="dash-map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="400" height="240" fill="url(#dash-map-water)" />
        <rect width="400" height="240" fill="url(#dash-map-grid)" />

        <g opacity="0.95">
          <path
            d="M0 52 Q48 38 96 44 T192 40 T288 46 T400 52 L400 240 L0 240 Z"
            fill="url(#dash-map-land)"
            stroke="rgba(255,255,255,0.05)"
          />
          <path
            d="M48 128 Q100 118 140 128 T210 134 T290 126 T368 132 L380 240 L36 240 Z"
            fill="#1a2030"
            opacity="0.88"
          />
          <path
            d="M300 56 Q330 48 368 62 L382 128 Q352 138 320 128 T288 118 Z"
            fill="#1e2533"
            opacity="0.9"
          />
        </g>

        <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.8">
          <path d="M0 88 H400 M0 128 H400 M0 168 H400" />
          <path d="M80 0 V240 M160 0 V240 M240 0 V240 M320 0 V240" />
        </g>

        <g className="dash-map-pin" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
          <circle cx="0" cy="0" r="32" fill="url(#dash-map-glow)" className="dash-pin-glow" />
          <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="6" fill="#6366f1" stroke="#fff" strokeWidth="2.5" />
          <path d="M0 7 L-5 17 L5 17 Z" fill="#6366f1" />
        </g>
      </svg>

      {appliedCountry && connected && (
        <div className="dash-map-spoof-badge">
          <span className="dash-map-spoof-dot" />
          Spoofing {appliedCountry}
          {connectedPhone && <span className="dash-map-spoof-device"> · {connectedPhone.name}</span>}
        </div>
      )}

      <div className="dash-map-countries">
        {COUNTRIES.slice(0, 10).map((c) => (
          <button
            key={c}
            type="button"
            className={`dash-map-tag ${country === c ? 'active' : ''}`}
            onClick={() => pick(c)}
            disabled={!connected}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="dash-map-controls">
        <button type="button" className="map-ctrl" aria-label="Zoom in" disabled={!connected}>
          +
        </button>
        <button type="button" className="map-ctrl" aria-label="Zoom out" disabled={!connected}>
          −
        </button>
      </div>

      <div className="dash-map-coords">
        <span>{spot.lat}</span>
        <span>·</span>
        <span>{spot.lng}</span>
      </div>

      <div className="dash-map-location-bar">
        <div className="dash-map-location-text">
          <span className="dash-map-location-label">Selected</span>
          <strong>{country}</strong>
        </div>
        <button
          type="button"
          className={`btn btn-primary dash-map-apply ${connected ? 'ready' : ''}`}
          onClick={handleApply}
        >
          {connected ? 'Use this location' : 'Connect phone first'}
        </button>
      </div>

      <PhoneConnection
        status={connectionStatus}
        phones={phones}
        selectedPhone={selectedPhone}
        connectedPhone={connectedPhone}
        onSelectPhone={onSelectPhone}
        onConnect={onConnect}
        onDisconnect={() => {
          onDisconnect();
          setShowPhonePanel(true);
        }}
        open={connectionStatus === 'waiting' || showPhonePanel}
        onClose={connectionStatus === 'connected' ? () => setShowPhonePanel(false) : undefined}
      />
    </div>
  );
}
