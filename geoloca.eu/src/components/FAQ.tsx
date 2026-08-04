import { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    q: 'Is the 3-day trial really free?',
    a: 'Yes. No credit card when you sign up. After 3 days you pick Pro, Yearly, or stop — nothing charges unless you choose a paid plan.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'No. All sales are final and we don\u2019t accept refunds. That\u2019s why we offer a full 3-day free trial with no card — test every feature before you pay.',
    policy: true,
  },
  {
    q: 'Does it work with Snap and Google Maps?',
    a: 'Yes. GeoLoca changes your phone GPS. Any app that reads location will show where you picked.',
  },
  {
    q: 'Why USB only?',
    a: 'iPhone location spoofing only works over a USB cable. Connect your iPhone, tap Trust, and GeoLoca sends the new GPS coordinates directly — Wi‑Fi connections are not supported.',
  },
  {
    q: 'Does it work with iPhone?',
    a: 'Yes — iPhone only. Plug in with USB, follow the 4 setup steps in the dashboard, then pick any country. Snap, Maps, and every other app follow your spoofed location.',
  },
  {
    q: 'Can I cancel?',
    a: 'Anytime from account settings. You keep access until the end of your billing period. No refunds on past payments.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section faq">
      <div className="container faq-layout">
        <div className="faq-intro">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title">Questions</h2>
          <p className="section-desc">Quick answers before you start your trial.</p>
          <a href="#pricing" className="btn btn-primary">
            Start free trial
          </a>
        </div>

        <div className="faq-list">
          {faqs.map((item, i) => (
            <div key={item.q} className={`faq-item ${open === i ? 'open' : ''} ${item.policy ? 'faq-item--policy' : ''}`}>
              <button type="button" className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className="faq-icon">{open === i ? '−' : '+'}</span>
              </button>
              <div className="faq-a-wrap" aria-hidden={open !== i}>
                <div className="faq-a-inner">
                  <p className="faq-a">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
