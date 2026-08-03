import './FAQ.css';

const faqs = [
  {
    q: 'Is the 3-day trial really free?',
    a: 'Yes. No credit card when you sign up. After 3 days you choose Pro or stop — nothing gets charged unless you pick a paid plan.',
  },
  {
    q: 'Does it work with Snap Map and Google Maps?',
    a: 'Yes. GeoLoca changes your phone GPS. Any app that uses location will show where you picked on the map.',
  },
  {
    q: 'Do I need to connect my phone to a laptop?',
    a: 'Yes. Plug in with USB or connect over Wi‑Fi. The laptop runs GeoLoca and sends the location to your phone.',
  },
  {
    q: 'Android or iPhone?',
    a: 'Both. Android has full support today. iPhone works over USB with the GeoLoca desktop app.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings. You keep access until the end of your billing period.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="section faq">
      <div className="container">
        <h2 className="section-title">FAQ</h2>
        <p className="section-desc">Common questions.</p>
        <dl className="faq-list">
          {faqs.map((item) => (
            <div key={item.q} className="faq-item">
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
