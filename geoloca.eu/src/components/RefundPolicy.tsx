import './RefundPolicy.css';

export default function RefundPolicy() {
  return (
    <section id="refund-policy" className="section refund-policy">
      <div className="container">
        <div className="refund-card">
          <div className="refund-head">
            <span className="section-tag">Policy</span>
            <h2 className="section-title">Refund policy</h2>
            <p className="refund-lead">
              <strong>We don&apos;t accept refunds.</strong> All sales are final once you choose a
              paid plan.
            </p>
          </div>
          <div className="refund-body">
            <div className="refund-point">
              <span className="refund-num">1</span>
              <div>
                <h3>Try before you pay</h3>
                <p>
                  The 3-day free trial is full access with no credit card. Test every country and
                  every app before spending anything.
                </p>
              </div>
            </div>
            <div className="refund-point">
              <span className="refund-num">2</span>
              <div>
                <h3>Cancel anytime</h3>
                <p>
                  Stop future charges from your account settings. You keep access until your billing
                  period ends — but past payments are not refunded.
                </p>
              </div>
            </div>
            <div className="refund-point">
              <span className="refund-num">3</span>
              <div>
                <h3>Need help?</h3>
                <p>
                  Contact support before upgrading if you&apos;re unsure. We&apos;d rather you trial
                  first than pay and regret it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
