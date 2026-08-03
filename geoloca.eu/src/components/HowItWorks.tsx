import './HowItWorks.css';

const steps = [
  {
    title: '1. Connect phone to laptop',
    text: 'Use a USB cable or connect both devices to the same Wi‑Fi. GeoLoca links them in seconds.',
  },
  {
    title: '2. Choose a country',
    text: 'Search on the map or type a city. Canada, Netherlands, Japan — anywhere you want.',
  },
  {
    title: '3. Turn it on',
    text: 'Your phone sends the new location to every app — Snap, Google Maps, Instagram, all of them.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <h2 className="section-title">How it works</h2>
        <p className="section-desc">Phone + laptop. That&apos;s it.</p>
        <div className="steps">
          {steps.map((step) => (
            <div key={step.title} className="step">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
