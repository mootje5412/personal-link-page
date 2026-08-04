import { Link } from 'react-router-dom';
import { useCountryRotator } from '../hooks/useCountryRotator';
import CountryRotator from './CountryRotator';
import HeroPreview from './HeroPreview';
import './Hero.css';

export default function Hero() {
  const { country, phase } = useCountryRotator();

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="hero-pill">Free 3-day trial · no card needed</span>
          <h1>
            Change your location to
            <span className="hero-accent">
              <CountryRotator country={country} phase={phase} />
            </span>
          </h1>
          <p className="hero-text">
            Connect your phone, pick any country on the map — Snap, Google Maps, and every other app
            follows.
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
            <Link to="/register" className="btn btn-secondary">
              Create account
            </Link>
          </div>
        </div>

        <HeroPreview country={country} />
      </div>
    </section>
  );
}
