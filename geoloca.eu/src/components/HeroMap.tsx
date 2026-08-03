import { MAP_SPOTS } from '../data/mapSpots';
import type { COUNTRIES } from '../data/countries';
import './HeroMap.css';

type Props = {
  country: (typeof COUNTRIES)[number];
};

export default function HeroMap({ country }: Props) {
  const spot = MAP_SPOTS[country];

  return (
    <div className="hero-map">
      <div className="hero-map-toolbar">
        <span className="hero-map-search">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {country}
        </span>
        <span className="hero-map-layer">Satellite</span>
      </div>

      <svg
        className="hero-map-svg"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="map-water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#12161f" />
            <stop offset="100%" stopColor="#0e1118" />
          </linearGradient>
          <linearGradient id="map-land" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252b38" />
            <stop offset="100%" stopColor="#1c222d" />
          </linearGradient>
          <radialGradient id="map-glow">
            <stop offset="0%" stopColor="rgba(99,102,241,0.22)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
        </defs>

        <rect width="400" height="200" fill="url(#map-water)" />

        <g className="map-landmasses" opacity="0.95">
          <path
            d="M0 48 Q40 36 88 42 T168 38 T248 44 T340 36 T400 48 L400 200 L0 200 Z"
            fill="url(#map-land)"
            stroke="rgba(255,255,255,0.04)"
          />
          <path
            d="M52 118 Q96 108 132 118 T198 124 T268 116 T348 122 L360 200 L40 200 Z"
            fill="#1a2030"
            opacity="0.85"
          />
          <path
            d="M290 52 Q318 46 352 58 L368 118 Q340 128 312 118 T278 108 Z"
            fill="#1e2533"
            opacity="0.9"
          />
        </g>

        <g className="map-roads" stroke="rgba(255,255,255,0.05)" strokeWidth="1">
          <path d="M0 72 H400" />
          <path d="M0 104 H400" />
          <path d="M0 136 H400" />
          <path d="M80 0 V200" />
          <path d="M160 0 V200" />
          <path d="M240 0 V200" />
          <path d="M320 0 V200" />
        </g>

        <g className="map-pin-group" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
          <circle cx="0" cy="0" r="28" fill="url(#map-glow)" className="map-pin-glow" />
          <circle cx="0" cy="0" r="16" fill="none" stroke="rgba(99,102,241,0.35)" strokeWidth="1" className="map-pin-ring" />
          <circle cx="0" cy="0" r="5.5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
          <path d="M0 6 L-4 14 L4 14 Z" fill="#6366f1" />
        </g>
      </svg>

      <div className="hero-map-controls">
        <button type="button" className="map-ctrl" aria-hidden tabIndex={-1}>
          +
        </button>
        <button type="button" className="map-ctrl" aria-hidden tabIndex={-1}>
          −
        </button>
      </div>

      <div className="hero-map-coords" key={country}>
        <span>{spot.lat}</span>
        <span className="coords-sep">·</span>
        <span>{spot.lng}</span>
      </div>
    </div>
  );
}
