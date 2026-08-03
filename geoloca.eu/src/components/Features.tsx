import './Features.css';

const items = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: 'All apps',
    text: 'Snap Map, Google Maps, Uber, dating apps — anything with GPS.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 10h14M10 3a10 10 0 0 1 3.5 7M10 17a10 10 0 0 1-3.5-7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    title: '195+ countries',
    text: 'Search cities or drop a pin anywhere on the map.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 3v14M6 7l4-4 4 4M6 13l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'No root',
    text: 'Normal phone setup. No jailbreak required.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M4 10h12M10 4v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="6" y="6" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: 'USB or Wi‑Fi',
    text: 'Cable or same network — your choice.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M5 5h10v10H5z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 3v4M12 3v4M8 13v4M12 13v4M3 8h4M13 8h4M3 12h4M13 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Saved spots',
    text: 'Bookmark locations and switch in one tap.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Instant off',
    text: 'Stop GeoLoca and your real GPS returns right away.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section features">
      <div className="container features-layout">
        <div className="features-intro">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Built for real use</h2>
          <p className="section-desc">
            Everything you need to control where your phone thinks you are.
          </p>
          <p className="features-scroll-hint">Scroll to stack</p>
        </div>

        <div className="feature-stack">
          {items.map((item, index) => (
            <article
              key={item.title}
              className="feature-card"
              style={{ '--i': index } as React.CSSProperties}
            >
              <span className="feature-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="feature-icon">{item.icon}</span>
              <div className="feature-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
