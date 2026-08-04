import './HowItWorks.css';

const steps = [
  { n: '1', title: 'Plug in iPhone', text: 'Connect your iPhone to your computer with a USB cable. Wi‑Fi will not work.' },
  { n: '2', title: 'Trust & choose model', text: 'Unlock your iPhone, tap Trust This Computer, then select your iPhone model.' },
  { n: '3', title: 'Change location', text: 'Pick any country on the map — your iPhone GPS updates instantly over USB.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">How it works</span>
          <h2 className="section-title">Three steps</h2>
          <p className="section-desc">iPhone over USB. That&apos;s the whole setup.</p>
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
