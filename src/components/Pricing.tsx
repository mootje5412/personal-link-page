import './Pricing.css'

const Pricing = () => {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span>Unbeatable Value</span>
          </div>
          <h2 className="section-title">
            Just <span className="gradient-text">€5</span> Per Month
          </h2>
          <p className="section-description">
            Access 700 billion breach records with enterprise-grade infrastructure.
            Less than a coffee, but with the power to protect millions.
          </p>
        </div>

        <div className="pricing-hero">
          <div className="pricing-card-single">
            <div className="pricing-header">
              <h3 className="pricing-name">Full Access</h3>
              <p className="pricing-subtitle">Everything you need to start</p>
            </div>
            <div className="pricing-price-large">
              <span className="price-currency">€</span>
              <span className="price-amount">5</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features-large">
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong>10,000 API calls</strong> per month</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong>700B+ records</strong> breach database</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Email & domain lookups</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Real-time breach updates</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>99.9% uptime guarantee</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Full API documentation</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Professional support</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Cancel anytime</span>
              </li>
            </ul>
            <button className="pricing-button-large btn-primary">Get Started Now</button>
          </div>
        </div>

        <div className="value-grid">
          <div className="value-item">
            <div className="value-number">€0.0005</div>
            <div className="value-label">Per API Call</div>
          </div>
          <div className="value-item">
            <div className="value-number">10x</div>
            <div className="value-label">Cheaper Than Competitors</div>
          </div>
          <div className="value-item">
            <div className="value-number">0€</div>
            <div className="value-label">Setup Fees</div>
          </div>
          <div className="value-item">
            <div className="value-number">24/7</div>
            <div className="value-label">Always Available</div>
          </div>
        </div>

        <div className="pricing-cta">
          <h3>The Smart Investment</h3>
          <p>
            For less than a coffee, get enterprise-grade OSINT intelligence. 
            Start protecting your users today with real-time breach data.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Pricing
