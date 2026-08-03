import CountryRotator from './CountryRotator';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="hero-pill">Free 3-day trial · no card needed</span>
          <h1>
            Change your location to
            <span className="hero-accent">
              <CountryRotator />
            </span>
          </h1>
          <p className="hero-text">
            Connect your phone to your laptop. Pick any country on the map — Snap, Google Maps,
            and every other app follows.
          </p>
          <div className="hero-actions">
            <a href="#pricing" className="btn btn-primary">
              Start free trial
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </a>
            <a href="#how" className="btn btn-secondary">
              How it works
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span className="hero-card-title">GeoLoca desktop</span>
            <span className="hero-card-status">Connected</span>
          </div>
          <div className="hero-card-row">
            <span className="label">Location</span>
            <span className="value">Netherlands</span>
          </div>
          <div className="hero-card-row">
            <span className="label">Phone</span>
            <span className="value">iPhone · USB</span>
          </div>
          <div className="hero-card-row">
            <span className="label">Apps synced</span>
            <span className="value">Snap, Maps +more</span>
          </div>
          <div className="hero-map">
            <div className="map-pin" />
          </div>
        </div>
      </div>
    </section>
  );
}
