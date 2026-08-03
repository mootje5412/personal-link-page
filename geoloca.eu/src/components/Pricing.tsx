import './Pricing.css';

const plans = [
  {
    name: 'Free trial',
    price: '€0',
    period: '3 days',
    desc: 'Try everything. No credit card needed to start.',
    features: [
      'All countries',
      'Snap & Google Maps',
      'USB + Wi‑Fi',
      'Full app access',
    ],
    cta: 'Start free trial',
    highlight: true,
    badge: 'Try free',
  },
  {
    name: 'Pro',
    price: '€4.99',
    period: '/ month',
    desc: 'After your trial. Cancel anytime.',
    features: [
      'Everything in trial',
      'Unlimited location changes',
      'Saved locations',
      'Priority support',
    ],
    cta: 'Get Pro',
    highlight: false,
  },
  {
    name: 'Yearly',
    price: '€39.99',
    period: '/ year',
    desc: 'Save 33% vs monthly.',
    features: [
      'Everything in Pro',
      '2 months free',
      'Early access to updates',
      'Family sharing (soon)',
    ],
    cta: 'Get Yearly',
    highlight: false,
    badge: 'Best value',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <h2 className="section-title">Pricing</h2>
        <p className="section-desc">
          Start with a <strong>free 3-day trial</strong>. No card required. Pick a plan when
          you&apos;re ready.
        </p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`plan ${plan.highlight ? 'plan-featured' : ''}`}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h3>{plan.name}</h3>
              <div className="plan-price">
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
                className={`btn ${plan.highlight ? 'btn-green' : 'btn-outline'} plan-btn`}
                onClick={(e) => e.preventDefault()}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="pricing-note">
          All plans include Android &amp; iPhone support. Prices in EUR. Trial ends automatically
          — we&apos;ll ask before charging you.
        </p>
      </div>
    </section>
  );
}
