import './Setup.css';

export default function Setup() {
  return (
    <section id="setup" className="section setup">
      <div className="setup-card">
        <div className="setup-text">
          <h2>Ready when you are</h2>
          <p>
            GeoLoca is coming soon. Connect your phone to your laptop and change your location
            to any country — starting with the landing page, then the full app.
          </p>
          <form
            className="notify-form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input type="email" placeholder="you@email.com" aria-label="Email" required />
            <button type="submit">Notify me</button>
          </form>
        </div>
        <ul className="setup-list">
          <li>Works with Android &amp; iPhone</li>
          <li>USB or Wi‑Fi connection</li>
          <li>No root required</li>
        </ul>
      </div>
    </section>
  );
}
