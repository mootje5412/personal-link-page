import './TrustBar.css';

const items = [
  { label: '195+ countries', detail: 'Anywhere on the map' },
  { label: '3-day free trial', detail: 'No credit card' },
  { label: 'Snap & Maps', detail: 'All GPS apps' },
  { label: 'No refunds', detail: 'Try before you pay' },
];

export default function TrustBar() {
  return (
    <section className="trust-bar" aria-label="Highlights">
      <div className="container trust-grid">
        {items.map((item) => (
          <div key={item.label} className="trust-item">
            <span className="trust-label">{item.label}</span>
            <span className="trust-detail">{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
