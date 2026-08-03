import { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    q: 'Is the 3-day trial really free?',
    a: 'Yes. No credit card when you sign up. After 3 days you pick Pro, Yearly, or stop — nothing charges unless you choose a paid plan.',
  },
  {
    q: 'Does it work with Snap and Google Maps?',
    a: 'Yes. GeoLoca changes your phone GPS. Any app that reads location will show where you picked.',
  },
  {
    q: 'Why do I need a laptop?',
    a: 'GeoLoca runs on your laptop and sends the location to your phone over USB or Wi‑Fi. Both devices work together.',
  },
  {
    q: 'Android and iPhone?',
    a: 'Both supported. Android has full features. iPhone works over USB with the desktop app.',
  },
  {
    q: 'Can I cancel?',
    a: 'Anytime from account settings. You keep access until the end of your billing period.',
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
            <div key={item.q} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button type="button" className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className="faq-icon">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <p className="faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
