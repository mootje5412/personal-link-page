import './HowItWorks.css';

const steps = [
  { n: '1', title: 'Connect devices', text: 'USB cable or Wi‑Fi. GeoLoca pairs your phone and laptop.' },
  { n: '2', title: 'Pick a country', text: 'Tap the map or search. Canada, Netherlands, Japan — anywhere.' },
  { n: '3', title: 'Go live', text: 'Every app on your phone uses the new location instantly.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">How it works</span>
          <h2 className="section-title">Three steps</h2>
          <p className="section-desc">Phone plus laptop. That&apos;s the whole setup.</p>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <article key={step.n} className="step-card">
              <span className="step-num">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
