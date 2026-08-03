import CountryRotator from './CountryRotator';
import './Hero.css';

const stats = [
  { value: '195+', label: 'Countries' },
  { value: 'USB', label: '& Wi‑Fi' },
  { value: '1‑click', label: 'Setup' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            GeoLoca.eu — coming soon
          </div>

          <h1>
            <span className="line">Change your location to</span>
            <span className="line accent-line">
              <CountryRotator />
            </span>
          </h1>

          <p className="hero-sub">
            Connect your phone to your laptop. Drop a pin anywhere on Earth — Snap Map,
            Google Maps, and every app follows.
          </p>

          <div className="hero-actions">
            <a href="#setup" className="btn btn-primary">
              Get early access
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#how" className="btn btn-ghost">
              How it works
            </a>
          </div>

          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual" aria-hidden>
          <div className="globe-wrap">
            <div className="globe-ring r1" />
            <div className="globe-ring r2" />
            <div className="globe-ring r3" />
            <div className="globe-core">
              <svg viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="48" stroke="url(#globeGrad)" strokeWidth="0.8" opacity="0.5" />
                <ellipse cx="60" cy="60" rx="48" ry="18" stroke="url(#globeGrad)" strokeWidth="0.6" opacity="0.35" />
                <ellipse cx="60" cy="60" rx="18" ry="48" stroke="url(#globeGrad)" strokeWidth="0.6" opacity="0.35" />
                <circle cx="60" cy="60" r="6" fill="#2dd4bf" />
                <circle cx="60" cy="60" r="12" stroke="#2dd4bf" strokeWidth="1" opacity="0.4" />
                <defs>
                  <linearGradient id="globeGrad" x1="0" y1="0" x2="120" y2="120">
                    <stop stopColor="#2dd4bf" />
                    <stop offset="1" stopColor="#38bdf8" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="globe-pin">
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
