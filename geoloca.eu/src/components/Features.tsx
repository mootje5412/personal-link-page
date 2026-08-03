import './Features.css';

const items = [
  { title: 'All apps', text: 'Snap Map, Google Maps, Uber, dating apps — anything with GPS.' },
  { title: '195+ countries', text: 'Search cities or drop a pin anywhere on the map.' },
  { title: 'No root', text: 'Normal phone setup. No jailbreak required.' },
  { title: 'USB or Wi‑Fi', text: 'Cable or same network — your choice.' },
  { title: 'Saved spots', text: 'Bookmark locations and switch in one tap.' },
  { title: 'Instant off', text: 'Stop GeoLoca and your real GPS returns right away.' },
];

export default function Features() {
  return (
    <section id="features" className="section features">
      <div className="container">
        <div className="section-head center">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Built for real use</h2>
          <p className="section-desc center">
            Everything you need to control where your phone thinks you are.
          </p>
        </div>
        <div className="feature-grid">
          {items.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
