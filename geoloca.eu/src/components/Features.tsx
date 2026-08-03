import './Features.css';

const items = [
  {
    title: 'All apps',
    text: 'Snap Map, Google Maps, Uber, Tinder — anything that uses GPS.',
  },
  {
    title: 'Any country',
    text: '195+ countries. Search cities or drop a pin on the map.',
  },
  {
    title: 'No root',
    text: 'Works on normal phones. No jailbreak or special hacks needed.',
  },
  {
    title: 'USB or Wi‑Fi',
    text: 'Connect with a cable or over your home network.',
  },
  {
    title: 'Save spots',
    text: 'Bookmark locations you use often and switch in one tap.',
  },
  {
    title: 'Stop anytime',
    text: 'Turn off GeoLoca and your real GPS comes back instantly.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section features">
      <div className="container">
        <h2 className="section-title">What you get</h2>
        <p className="section-desc">Everything you need to change where your phone thinks you are.</p>
        <div className="feature-grid">
          {items.map((item) => (
            <div key={item.title} className="feature">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
