import { COUNTRIES } from '../data/countries';
import Reveal from './Reveal';
import './Countries.css';

export default function Countries() {
  const row = [...COUNTRIES, ...COUNTRIES];

  return (
    <section id="countries" className="countries-section">
      <div className="section">
        <Reveal>
          <div className="section-head center">
            <span className="section-label">Worldwide</span>
            <h2>Every country. One tap.</h2>
            <p>From Canada to Japan — jump anywhere without leaving your desk.</p>
          </div>
        </Reveal>
      </div>

      <div className="marquee-wrap" aria-hidden>
        <div className="marquee">
          {row.map((country, i) => (
            <span key={`${country}-${i}`} className="marquee-item">
              {country}
            </span>
          ))}
        </div>
      </div>

      <div className="marquee-wrap reverse" aria-hidden>
        <div className="marquee slow">
          {[...row].reverse().map((country, i) => (
            <span key={`r-${country}-${i}`} className="marquee-item dim">
              {country}
            </span>
          ))}
        </div>
      </div>

      <div className="section countries-foot">
        <Reveal>
          <p className="countries-more">+ 180 more destinations</p>
        </Reveal>
      </div>
    </section>
  );
}
