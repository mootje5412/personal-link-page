import CountryRotator from './CountryRotator';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <h1>
          Change your location to
          <br />
          <CountryRotator />
        </h1>
        <p className="hero-text">
          Connect your phone to your laptop. Pick any country. Snap Map, Google Maps and other
          apps use your new spot.
        </p>
        <div className="hero-btns">
          <a href="#pricing" className="btn btn-green">
            Start free 3-day trial
          </a>
          <a href="#how" className="btn btn-outline">
            How it works
          </a>
        </div>
        <ul className="hero-list">
          <li>Works on Android &amp; iPhone</li>
          <li>USB or Wi‑Fi</li>
          <li>195+ countries</li>
        </ul>
      </div>
    </section>
  );
}
