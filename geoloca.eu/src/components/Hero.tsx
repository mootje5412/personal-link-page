import CountryRotator from './CountryRotator';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden />
      <div className="hero-content">
        <p className="hero-tag">GeoLoca.eu</p>
        <h1>
          Change your location to
          <br />
          <CountryRotator />
        </h1>
        <p className="hero-sub">
          Connect your phone to your laptop. Pick any country on the map. Your apps see you
          there.
        </p>
        <div className="hero-actions">
          <a href="#setup" className="btn btn-primary">
            Start setup
          </a>
          <a href="#how" className="btn btn-ghost">
            See how it works
          </a>
        </div>
      </div>

      <div className="hero-visual" aria-hidden>
        <div className="orbit">
          <div className="orbit-ring" />
          <div className="orbit-dot d1" />
          <div className="orbit-dot d2" />
          <div className="orbit-dot d3" />
          <div className="orbit-core">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="11" r="2.5" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
