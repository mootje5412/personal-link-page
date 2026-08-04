import type { COUNTRIES } from '../data/countries';
import HeroMap from './HeroMap';
import './HeroPreview.css';

const syncedApps = [
  { name: 'Snap', color: '#fffc00' },
  { name: 'Maps', color: '#4285f4' },
  { name: 'Instagram', color: '#e1306c' },
];

type Props = {
  country: (typeof COUNTRIES)[number];
};

export default function HeroPreview({ country }: Props) {
  return (
    <div className="hero-preview">
      <div className="hero-preview-chrome">
        <span className="chrome-dot red" />
        <span className="chrome-dot yellow" />
        <span className="chrome-dot green" />
      </div>

      <div className="hero-card-header">
        <span className="hero-card-title">GeoLoca desktop</span>
        <span className="hero-card-status">USB connected</span>
      </div>

      <div className="hero-preview-rows">
        <div className="hero-card-row">
          <span className="label">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5a4 4 0 0 1 4 4c0 2.8-4 7.5-4 7.5S3 8.3 3 5.5a4 4 0 0 1 4-4Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="7" cy="5.5" r="1.2" fill="currentColor" />
            </svg>
            Location
          </span>
          <span key={country} className="value country-value">
            {country}
          </span>
        </div>
        <div className="hero-card-row">
          <span className="label">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="3.5" y="1.5" width="7" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 11.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Phone
          </span>
          <span className="value">iPhone · USB</span>
        </div>
        <div className="hero-card-row apps-row">
          <span className="label">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 7.5 5.5 11 12 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Apps synced
          </span>
          <div className="app-badges">
            {syncedApps.map((app) => (
              <span key={app.name} className="app-badge">
                <span className="app-dot" style={{ background: app.color }} />
                {app.name}
              </span>
            ))}
            <span className="app-more">+more</span>
          </div>
        </div>
      </div>

      <HeroMap country={country} />
    </div>
  );
}
