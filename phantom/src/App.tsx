import { useEffect, useState } from 'react';
import InstallPrompt from './components/InstallPrompt';
import './App.css';

const TABS = ['Home', 'Trade', 'Predict', 'Explore'] as const;

const TOKENS = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    amount: '0.0001',
    value: '€0.18',
    change: '-0.01%',
    up: false,
    icon: 'eth' as const,
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    amount: '0.0078',
    value: '€0.69',
    change: '+0.41%',
    up: true,
    icon: 'sol' as const,
  },
];

const PERPS = [
  { symbol: 'BTC', leverage: '40x', change: '+0.01%', up: true, color: '#f7931a' },
  { symbol: 'ETH', leverage: '25x', change: '-0.02%', up: false, color: '#627eea' },
  { symbol: 'SOL', leverage: '20x', change: '+0.41%', up: true, color: '#9945ff' },
  { symbol: 'HYPE', leverage: '10x', change: '+0.05%', up: true, color: '#50fa7b' },
];

function TokenIcon({ type }: { type: 'eth' | 'sol' }) {
  if (type === 'eth') {
    return (
      <svg className="token-svg" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#627eea" />
        <path fill="#fff" d="M16.5 4v8.9l7.2 3.1L16.5 4zm0 0L9.3 15.9l7.2-3V4zm0 18.1V28l7.2-10.1-7.2 4.2zm0 0l-7.2-10.1 7.2 4.2v5.9z" opacity=".95" />
      </svg>
    );
  }
  return (
    <svg className="token-svg" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="sol-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945ff" />
          <stop offset="100%" stopColor="#14f195" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#sol-g)" />
      <path fill="#fff" d="M10 20.5l6.2-1.1 2.8-6.8-6.2 1.1L10 20.5zm12-8.2l-6.2 1.1-2.8 6.8 6.2-1.1 2.8-6.8z" />
    </svg>
  );
}

function PerpIcon({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div className="perp-icon" style={{ background: color }}>
      {symbol.slice(0, 1)}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Home');
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShowInstall(!standalone);
  }, []);

  return (
    <div className="app">
      <header className="top-bar">
        <button type="button" className="avatar" aria-label="Account">
          <span className="avatar-inner" />
        </button>

        <nav className="tab-pills" aria-label="Sections">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        <button type="button" className="account-picker">
          <span>Account 1</span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>

        <div className="balance-block">
          <p className="balance">€1.24</p>
          <span className="pnl up">+€0.00494214 +0.40%</span>
        </div>

        <div className="cash-card">
          <div className="cash-icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="16" cy="12.5" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="cash-label">Cash</span>
          <span className="cash-value">€0.00</span>
        </div>

        <section className="section">
          <button type="button" className="section-head">
            Tokens
            <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden>
              <path d="M1.5 1L6.5 6L1.5 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          <div className="token-list">
            {TOKENS.map((token) => (
              <div key={token.symbol} className="token-row">
                <TokenIcon type={token.icon} />
                <div className="token-main">
                  <span className="token-name">{token.name}</span>
                  <span className="token-amount">
                    {token.amount} {token.symbol}
                  </span>
                </div>
                <div className="token-right">
                  <span className="token-value">{token.value}</span>
                  <span className={`token-change ${token.up ? 'up' : 'down'}`}>{token.change}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <button type="button" className="section-head">
            Perps
            <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden>
              <path d="M1.5 1L6.5 6L1.5 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          <div className="perps-scroll">
            {PERPS.map((perp) => (
              <div key={perp.symbol} className="perp-card">
                <PerpIcon symbol={perp.symbol} color={perp.color} />
                <span className="perp-symbol">{perp.symbol}</span>
                <span className="perp-lev">{perp.leverage}</span>
                <span className={`perp-change ${perp.up ? 'up' : 'down'}`}>{perp.change}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bottom-bar">
        <div className="search-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Search Phantom</span>
        </div>
        <button type="button" className="fab" aria-label="Add">
          +
        </button>
      </footer>

      {showInstall && (
        <div className="install-overlay">
          <InstallPrompt onDismiss={() => setShowInstall(false)} />
        </div>
      )}
    </div>
  );
}
