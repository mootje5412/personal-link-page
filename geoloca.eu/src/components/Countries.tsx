import { COUNTRIES } from '../data/countries';
import './Countries.css';

export default function Countries() {
  return (
    <section id="countries" className="section countries">
      <div className="container">
        <div className="section-head center">
          <span className="section-tag">Worldwide</span>
          <h2 className="section-title">Go anywhere</h2>
          <p className="section-desc center">Popular destinations — and 180+ more.</p>
        </div>
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
