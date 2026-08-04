import { useEffect, useState } from 'react';
import InstallPrompt from './components/InstallPrompt';
import PhantomLogo from './components/PhantomLogo';
import './App.css';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function App() {
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <PhantomLogo size={36} />
        <span className="header-title">Phantom</span>
      </header>

      <main className="main">
        <div className="hero-logo">
          <PhantomLogo size={88} glow />
        </div>

        <h1 className="title">Your wallet, on your home screen</h1>
        <p className="subtitle">
          Install Phantom to open it like a native app — one tap from your phone.
        </p>

        {!installed ? (
          <div className="install-card">
            <h2>Add to Home Screen</h2>
            <p className="install-lead">
              Tap below on Android, or use Share → Add to Home Screen on iPhone.
            </p>
            <InstallPrompt />
          </div>
        ) : (
          <div className="installed-badge">
            <span className="check">✓</span>
            <div>
              <strong>Installed</strong>
              <p>You&apos;re running Phantom from your home screen.</p>
            </div>
          </div>
        )}

        <section className="wallet-preview" aria-label="Wallet preview">
          <div className="balance-card">
            <p className="label">Total balance</p>
            <p className="balance">$0.00</p>
            <p className="balance-sub">Connect a wallet to get started</p>
          </div>

          <div className="actions">
            <button type="button" className="action-btn primary">
              Receive
            </button>
            <button type="button" className="action-btn">
              Send
            </button>
            <button type="button" className="action-btn">
              Swap
            </button>
          </div>

          <div className="tokens">
            <p className="tokens-title">Tokens</p>
            <div className="token-row">
              <div className="token-icon sol">◎</div>
              <div className="token-info">
                <span>Solana</span>
                <small>SOL</small>
              </div>
              <div className="token-balance">
                <span>0.00</span>
                <small>$0.00</small>
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="tab-bar" aria-label="Navigation">
        <button type="button" className="tab active" aria-current="page">
          <span className="tab-icon">🏠</span>
          Home
        </button>
        <button type="button" className="tab">
          <span className="tab-icon">🔍</span>
          Explore
        </button>
        <button type="button" className="tab">
          <span className="tab-icon">⇄</span>
          Swap
        </button>
        <button type="button" className="tab">
          <span className="tab-icon">⚙</span>
          Settings
        </button>
      </nav>
    </div>
  );
}
