import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard">
      <header className="dashboard-nav">
        <div className="container dashboard-nav-inner">
          <Link to="/" className="dashboard-logo">
            Geo<span>Loca</span>
          </Link>
          <div className="dashboard-user">
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
            <button type="button" className="btn btn-secondary dashboard-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main container">
        <div className="dashboard-welcome">
          <span className="section-tag">Dashboard</span>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p>
            Your account is ready. Download GeoLoca desktop, connect your phone, and pick your
            first country.
          </p>
          <div className="dashboard-actions">
            <a href="/#pricing" className="btn btn-primary">
              Start free trial
            </a>
            <Link to="/" className="btn btn-secondary">
              Back to home
            </Link>
          </div>
        </div>

        <div className="dashboard-cards">
          <article className="dashboard-card">
            <h3>1 · Download desktop app</h3>
            <p>Install GeoLoca on your laptop to control your phone location.</p>
          </article>
          <article className="dashboard-card">
            <h3>2 · Connect your phone</h3>
            <p>USB or Wi‑Fi — pair iPhone or Android in seconds.</p>
          </article>
          <article className="dashboard-card">
            <h3>3 · Pick a country</h3>
            <p>Snap, Google Maps, and every GPS app follows instantly.</p>
          </article>
        </div>
      </main>
    </div>
  );
}
