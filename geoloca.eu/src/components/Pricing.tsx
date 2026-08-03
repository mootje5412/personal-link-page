import './Pricing.css';

const plans = [
  {
    name: 'Free trial',
    price: '€0',
    period: '3 days',
    desc: 'Full access. No credit card to start.',
    features: ['All countries', 'Snap & Google Maps', 'USB + Wi‑Fi', 'Every feature unlocked'],
    cta: 'Start free trial',
    featured: true,
    badge: 'Start here',
  },
  {
    name: 'Pro',
    price: '€4.99',
    period: '/ month',
    desc: 'After trial. Cancel anytime — no refunds.',
    features: ['Unlimited changes', 'Saved locations', 'Priority support', 'All app updates'],
    cta: 'Get Pro',
    featured: false,
  },
  {
    name: 'Yearly',
    price: '€39.99',
    period: '/ year',
    desc: 'Save 33% vs paying monthly.',
    features: ['Everything in Pro', '2 months free', 'Early features', 'Family plan soon'],
    cta: 'Get Yearly',
    featured: false,
    badge: 'Best value',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <div className="section-head center">
          <span className="section-tag">Pricing</span>
          <h2 className="section-title">Simple plans</h2>
          <p className="section-desc center">
            <strong className="trial-highlight">Free 3-day trial</strong> — no card required. We
            only charge if you choose a paid plan.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="plan-desc">{plan.desc}</p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a
                href="#"
                className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} plan-btn`}
                onClick={(e) => e.preventDefault()}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>

        <div className="pricing-policy">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p>
            <strong>All sales are final.</strong> We don&apos;t accept refunds.{' '}
            <a href="#refund-policy" className="policy-link">
              Read full policy
            </a>
            . Use the free trial to test everything first.
          </p>
        </div>

        <p className="pricing-foot">
          Android &amp; iPhone · EUR pricing · Cancel anytime from your account
        </p>
      </div>
    </section>
  );
}
