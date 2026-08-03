import './HowItWorks.css';

const steps = [
  {
    num: '01',
    title: 'Connect phone to laptop',
    text: 'Plug in with USB or connect over Wi‑Fi. GeoLoca pairs your devices in one click.',
  },
  {
    num: '02',
    title: 'Pick a country',
    text: 'Search or tap anywhere on the map. Canada, Netherlands, Japan — anywhere you want.',
  },
  {
    num: '03',
    title: 'Go live',
    text: 'Your phone uses the new location. Snap Map, Maps, and other apps follow along.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <div className="section-head">
        <h2>How it works</h2>
        <p>Three steps. Phone plus laptop. Any country.</p>
      </div>
      <div className="steps">
        {steps.map((step) => (
          <article key={step.num} className="step">
            <span className="step-num">{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
