import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DashboardMap from '../components/DashboardMap';
import './Dashboard.css';

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

  const firstName = user.name.split(' ')[0];
  const daysLeft = trialDaysLeft(user.trialEndsAt);
  const connected = false;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <Link to="/" className="dash-logo">
          Geo<span>Loca</span>
        </Link>

        <div className="dash-header-center">
          <p className="dash-welcome">
            Welcome back, <strong>{firstName}</strong>
          </p>
          {user.trialActive && (
            <span className="dash-trial-pill">
              {daysLeft} day{daysLeft === 1 ? '' : 's'} left on trial
            </span>
          )}
        </div>

        <div className="dash-header-actions">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="dash-avatar" />
          ) : (
            <span className="dash-avatar dash-avatar-fallback">{firstName.charAt(0)}</span>
          )}
          <button type="button" className="btn btn-secondary dash-logout-btn" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        <DashboardMap connected={connected} />

        <aside className="dash-panel">
          <div className={`dash-connect ${connected ? 'online' : 'waiting'}`}>
            <div className="dash-connect-head">
              <span className="dash-status-dot" />
              <span className="dash-status-label">
                {connected ? 'Connected to laptop' : 'Waiting to connect'}
              </span>
            </div>

            {connected ? (
              <>
                <p className="dash-connect-text">
                  Your laptop is linked. Pick a country on the map — your phone follows instantly.
                </p>
                <ul className="dash-connect-list">
                  <li>
                    <span>Laptop</span>
                    <strong>Online</strong>
                  </li>
                  <li>
                    <span>Phone</span>
                    <strong>Ready</strong>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="dash-connect-text">
                  Open <strong>GeoLoca desktop</strong> on your laptop and sign in with the same
                  account. The map unlocks once your devices are paired.
                </p>
                <ol className="dash-connect-steps">
                  <li>Download GeoLoca on your laptop</li>
                  <li>Connect your phone via USB or Wi‑Fi</li>
                  <li>Pick any country on the map</li>
                </ol>
                <button type="button" className="btn btn-primary dash-connect-btn">
                  Download desktop app
                </button>
              </>
            )}
          </div>

          <div className="dash-account-mini">
            <span className="dash-account-label">Signed in as</span>
            <strong>{user.email}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
