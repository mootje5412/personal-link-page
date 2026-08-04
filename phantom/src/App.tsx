import { useCallback, useEffect, useState } from 'react';
import AddFundsModal from './components/AddFundsModal';
import InstallPrompt from './components/InstallPrompt';
import {
  PERP_DEFS,
  TOKEN_DEFS,
  calcPortfolio,
  fetchPrices,
  formatChangePct,
  formatEur,
  formatEurDelta,
  formatPnlEur,
  formatTokenAmount,
  loadWallet,
  saveWallet,
  type Prices,
  type WalletState,
} from './utils/wallet';
import './App.css';

const TABS = ['Home', 'Trade', 'Predict', 'Explore'] as const;

function VerifiedBadge() {
  return (
    <svg className="verified" width="16" height="16" viewBox="0 0 16 16" aria-label="Verified">
      <circle cx="8" cy="8" r="8" fill="#AB9FF2" />
      <path
        d="M4.5 8.2L6.8 10.5L11.5 5.8"
        stroke="#fff"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Home');
  const [showInstall, setShowInstall] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [wallet, setWallet] = useState<WalletState>(loadWallet);
  const [prices, setPrices] = useState<Prices | null>(null);

  const refreshPrices = useCallback(async () => {
    try {
      setPrices(await fetchPrices());
    } catch {
      /* keep last prices */
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShowInstall(!standalone);
  }, []);

  useEffect(() => {
    refreshPrices();
    const id = window.setInterval(refreshPrices, 60_000);
    return () => window.clearInterval(id);
  }, [refreshPrices]);

  useEffect(() => {
    saveWallet(wallet);
  }, [wallet]);

  const portfolio = prices ? calcPortfolio(wallet, prices) : null;
  const pnlUp = (portfolio?.pnlEur ?? 0) >= 0;

  return (
    <div className="app">
      <header className="top-bar">
        <button type="button" className="avatar" aria-label="Account">
          <span className="avatar-gradient" />
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
          <p className="balance">{portfolio ? formatEur(portfolio.total) : '—'}</p>
          {portfolio && (
            <span className={`pnl ${pnlUp ? 'up' : 'down'}`}>
              {formatPnlEur(portfolio.pnlEur)} {formatChangePct(portfolio.pnlPct)}
            </span>
          )}
        </div>

        <button type="button" className="cash-card" onClick={() => setShowAddFunds(true)}>
          <div className="cash-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="17" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="cash-label">Cash</span>
          <span className="cash-value">{formatEur(wallet.cash)}</span>
        </button>

        <section className="section">
          <button type="button" className="section-head">
            <span>Tokens</span>
            <svg width="7" height="11" viewBox="0 0 8 12" aria-hidden>
              <path d="M1.5 1L6.5 6L1.5 11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          <div className="token-list">
            {TOKEN_DEFS.map((token) => {
              const amount = wallet.holdings[token.id] ?? 0;
              const price = prices?.[token.id];
              const value = price ? amount * price.eur : 0;
              const up = (price?.change24h ?? 0) >= 0;
              if (amount <= 0) return null;
              return (
                <button
                  key={token.id}
                  type="button"
                  className="token-row"
                  onClick={() => setShowAddFunds(true)}
                >
                  <img src={token.logo} alt="" className="coin-logo" />
                  <div className="token-main">
                    <span className="token-name-row">
                      <span className="token-name">{token.name}</span>
                      {token.verified && <VerifiedBadge />}
                    </span>
                    <span className="token-amount">{formatTokenAmount(amount, token.symbol)}</span>
                  </div>
                  <div className="token-right">
                    <span className="token-value">{price ? formatEur(value) : '—'}</span>
                    {price && (
                      <span className={`token-change ${up ? 'up' : 'down'}`}>
                        {formatEurDelta(value, price.change24h)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section">
          <button type="button" className="section-head">
            <span>Perps</span>
            <svg width="7" height="11" viewBox="0 0 8 12" aria-hidden>
              <path d="M1.5 1L6.5 6L1.5 11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          <div className="perps-scroll">
            {PERP_DEFS.map((perp) => {
              const price = prices?.[perp.id];
              const up = (price?.change24h ?? 0) >= 0;
              return (
                <div key={perp.symbol} className="perp-card">
                  <img src={perp.logo} alt="" className="perp-logo" />
                  <span className="perp-title">
                    {perp.symbol} {perp.leverage}
                  </span>
                  {price && (
                    <span className={`perp-change ${up ? 'up' : 'down'}`}>
                      {formatChangePct(price.change24h)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bottom-bar">
        <div className="search-pill">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Search Phantom</span>
        </div>
        <button type="button" className="fab" aria-label="Add funds" onClick={() => setShowAddFunds(true)}>
          +
        </button>
      </footer>

      <AddFundsModal
        open={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        wallet={wallet}
        onSave={setWallet}
      />

      {showInstall && (
        <div className="install-overlay">
          <InstallPrompt onDismiss={() => setShowInstall(false)} />
        </div>
      )}
    </div>
  );
}
