import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function trialDaysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="dashboard dashboard-loading">
        <div className="dashboard-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const daysLeft = trialDaysLeft(user.trialEndsAt);

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          Geo<span>Loca</span>
        </Link>

        <nav className="dashboard-menu">
          <a href="#overview" className="dashboard-menu-item active">
            Overview
          </a>
          <a href="#setup" className="dashboard-menu-item">
            Setup
          </a>
          <a href="#account" className="dashboard-menu-item">
            Account
          </a>
        </nav>

        <div className="dashboard-sidebar-foot">
          <div className="security-badge">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5 11 3.5V7c0 2.2-1.7 4.2-4 4.8C4.7 11.2 3 9.2 3 7V3.5L7 1.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M5 7l1.2 1.2L9 5.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Secured session
          </div>
          <button type="button" className="btn btn-secondary dashboard-logout" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </aside>

      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div>
            <span className="section-tag">Dashboard</span>
            <h1>Hi, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="dashboard-profile">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="dashboard-avatar" />
            ) : (
              <span className="dashboard-avatar dashboard-avatar-fallback">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="dashboard-user-meta">
              <span className="dashboard-user-name">{user.name}</span>
              <span className="dashboard-user-email">{user.email}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <section id="overview" className="dashboard-grid">
            <article className={`dash-card dash-trial ${user.trialActive ? 'active' : 'ended'}`}>
              <div className="dash-card-label">Free trial</div>
              {user.trialActive ? (
                <>
                  <div className="dash-trial-days">{daysLeft}</div>
                  <p className="dash-trial-text">
                    day{daysLeft === 1 ? '' : 's'} left · ends {formatDate(user.trialEndsAt)}
                  </p>
                </>
              ) : (
                <>
                  <div className="dash-trial-days">0</div>
                  <p className="dash-trial-text">Trial ended · choose a plan to continue</p>
                </>
              )}
              <a href="/#pricing" className="btn btn-primary dash-card-btn">
                {user.trialActive ? 'View plans' : 'Upgrade now'}
              </a>
            </article>

            <article className="dash-card">
              <div className="dash-card-label">Countries</div>
              <div className="dash-stat">195+</div>
              <p className="dash-card-text">Available on the map</p>
            </article>

            <article className="dash-card">
              <div className="dash-card-label">Sign-in method</div>
              <div className="dash-stat dash-stat-sm">{user.provider === 'google' ? 'Google' : 'Email'}</div>
              <p className="dash-card-text">Account verified</p>
            </article>
          </section>

          <section id="setup" className="dashboard-section">
            <h2>Get started in 3 steps</h2>
            <div className="dashboard-steps">
              <article className="dashboard-step">
                <span className="step-badge">1</span>
                <div>
                  <h3>Download desktop app</h3>
                  <p>Install GeoLoca on your laptop — Windows or Mac.</p>
                </div>
                <button type="button" className="btn btn-secondary">
                  Download
                </button>
              </article>
              <article className="dashboard-step">
                <span className="step-badge">2</span>
                <div>
                  <h3>Connect your phone</h3>
                  <p>USB cable or same Wi‑Fi network. iPhone & Android.</p>
                </div>
                <span className="step-status">Waiting</span>
              </article>
              <article className="dashboard-step">
                <span className="step-badge">3</span>
                <div>
                  <h3>Pick a location</h3>
                  <p>Snap Map, Google Maps, and all GPS apps follow.</p>
                </div>
                <span className="step-status muted">Not started</span>
              </article>
            </div>
          </section>

          <section id="account" className="dashboard-section">
            <h2>Account & security</h2>
            <div className="account-panel">
              <div className="account-row">
                <span>Name</span>
                <strong>{user.name}</strong>
              </div>
              <div className="account-row">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="account-row">
                <span>Member since</span>
                <strong>{formatDate(user.createdAt)}</strong>
              </div>
              <div className="account-row">
                <span>Session</span>
                <strong className="secure-text">HttpOnly · encrypted</strong>
              </div>
            </div>
            <p className="account-note">
              Passwords are hashed with Argon2id. Sessions are stored server-side in SQL — never in
              browser storage.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
