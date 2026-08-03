import './CTA.css';

export default function CTA() {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-card">
          <div className="cta-copy">
            <span className="section-tag">Get started</span>
            <h2 className="cta-title">Try every country free for 3 days</h2>
            <p className="cta-desc">
              No credit card. No refunds on paid plans — but you can test everything before you
              pay.
            </p>
          </div>
          <div className="cta-actions">
            <a href="#pricing" className="btn btn-primary">
              Start free trial
            </a>
            <a href="#refund-policy" className="btn btn-secondary">
              Refund policy
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
