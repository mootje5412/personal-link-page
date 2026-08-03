import { COUNTRIES } from '../data/countries';
import './Countries.css';

export default function Countries() {
  return (
    <section id="countries" className="section countries">
      <div className="container">
        <h2 className="section-title">Countries</h2>
        <p className="section-desc">Some of the places people go with GeoLoca.</p>
        <div className="country-grid">
          {COUNTRIES.map((c) => (
            <span key={c} className="country-tag">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
