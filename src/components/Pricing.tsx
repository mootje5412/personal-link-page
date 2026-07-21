import './Pricing.css'

const Pricing = () => {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span>Simple Pricing</span>
          </div>
          <h2 className="section-title">
            Professional OSINT<br />
            <span className="gradient-text">For Everyone</span>
          </h2>
          <p className="section-description">
            No hidden fees. No complicated tiers. Just powerful breach intelligence at an unbeatable price.
          </p>
        </div>

        <div className="pricing-cards">
          <div className="pricing-card pricing-card-starter">
            <div className="pricing-header">
              <h3 className="pricing-name">Starter</h3>
              <p className="pricing-subtitle">Perfect for individual researchers</p>
            </div>
            <div className="pricing-price">
              <span className="price-currency">€</span>
              <span className="price-amount">5</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features">
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong>10,000 API calls</strong> per month</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Full database access</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Email & domain lookups</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Standard support</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>API documentation</span>
              </li>
            </ul>
            <button className="pricing-button btn-secondary">Get Started</button>
          </div>

          <div className="pricing-card pricing-card-pro">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-header">
              <h3 className="pricing-name">Professional</h3>
              <p className="pricing-subtitle">For security professionals</p>
            </div>
            <div className="pricing-price">
              <span className="price-currency">€</span>
              <span className="price-amount">49</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features">
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong>100,000 API calls</strong> per month</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Everything in Starter</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Batch operations</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Webhook notifications</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Priority support</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Advanced analytics</span>
              </li>
            </ul>
            <button className="pricing-button btn-primary">Get Started</button>
          </div>

          <div className="pricing-card pricing-card-enterprise">
            <div className="pricing-header">
              <h3 className="pricing-name">Enterprise</h3>
              <p className="pricing-subtitle">For teams and organizations</p>
            </div>
            <div className="pricing-price">
              <span className="price-custom">Custom</span>
            </div>
            <ul className="pricing-features">
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><strong>Unlimited API calls</strong></span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Everything in Professional</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Dedicated infrastructure</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>SLA guarantee</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>24/7 premium support</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Custom integrations</span>
              </li>
            </ul>
            <button className="pricing-button btn-secondary">Contact Sales</button>
          </div>
        </div>

        <div className="pricing-faq">
          <h3>Incredible Value</h3>
          <p className="value-proposition">
            At just <strong>€5/month</strong>, you get access to 500M+ breach records with enterprise-grade infrastructure. 
            That's less than the cost of a coffee, but with the power to protect thousands of users. 
            This is an investment in security that pays for itself instantly.
          </p>
          <div className="value-stats">
            <div className="value-stat">
              <span className="value-stat-number">€0.0005</span>
              <span className="value-stat-label">Cost per API call</span>
            </div>
            <div className="value-stat">
              <span className="value-stat-number">10x</span>
              <span className="value-stat-label">Cheaper than competitors</span>
            </div>
            <div className="value-stat">
              <span className="value-stat-number">0</span>
              <span className="value-stat-label">Setup fees or hidden costs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
