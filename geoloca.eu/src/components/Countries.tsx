import { COUNTRIES } from '../data/countries';
import './Countries.css';

export default function Countries() {
  return (
    <section id="countries" className="section countries">
      <div className="section-head">
        <h2>Every country</h2>
        <p>Jump anywhere in the world — no limits.</p>
      </div>
      <div className="country-grid">
        {COUNTRIES.map((country) => (
          <span key={country} className="country-chip">
            {country}
          </span>
        ))}
        <span className="country-chip muted">+ 180 more</span>
      </div>
    </section>
  );
}
