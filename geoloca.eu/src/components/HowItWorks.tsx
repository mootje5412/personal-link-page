import Reveal from './Reveal';
import './HowItWorks.css';

const steps = [
  {
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="7" y="2" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: 'Connect phone to laptop',
    text: 'USB cable or same Wi‑Fi network. GeoLoca pairs both devices automatically.',
  },
  {
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    title: 'Pick any country',
    text: 'Search Tokyo, tap Amsterdam, or drop a pin in the middle of nowhere.',
  },
  {
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M13 2L4 14h7l-1 8 10-14h-7l1-6Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Go live instantly',
    text: 'Every app on your phone reads the new location. Snap, Maps, everything.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <Reveal>
        <div className="section-head center">
          <span className="section-label">How it works</span>
          <h2>Three steps to anywhere</h2>
          <p>Phone plus laptop. No complicated setup. Any country on Earth.</p>
        </div>
      </Reveal>

      <div className="steps">
        {steps.map((step, i) => (
          <Reveal key={step.num} delay={i * 100}>
            <article className="step">
              <div className="step-icon">{step.icon}</div>
              <span className="step-num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
