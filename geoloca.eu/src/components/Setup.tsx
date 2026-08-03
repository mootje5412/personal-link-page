import { useState } from 'react';
import Reveal from './Reveal';
import './Setup.css';

export default function Setup() {
  const [sent, setSent] = useState(false);

  return (
    <section id="setup" className="section setup">
      <Reveal>
        <div className="setup-card">
          <div className="setup-glow" aria-hidden />
          <div className="setup-grid">
            <div className="setup-main">
              <span className="section-label">Early access</span>
              <h2>Be first in line</h2>
              <p>
                GeoLoca launches soon. Connect your phone to your laptop and teleport anywhere —
                we&apos;ll let you know the moment it&apos;s ready.
              </p>

              {sent ? (
                <p className="setup-success">You&apos;re on the list. We&apos;ll be in touch.</p>
              ) : (
                <form
                  className="notify-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                >
                  <input type="email" placeholder="you@email.com" aria-label="Email" required />
                  <button type="submit" className="btn btn-primary">
                    Notify me
                  </button>
                </form>
              )}
            </div>

            <ul className="setup-features">
              <li>
                <span className="feat-icon">✓</span>
                Android &amp; iPhone
              </li>
              <li>
                <span className="feat-icon">✓</span>
                USB or Wi‑Fi
              </li>
              <li>
                <span className="feat-icon">✓</span>
                No root needed
              </li>
              <li>
                <span className="feat-icon">✓</span>
                All apps supported
              </li>
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
