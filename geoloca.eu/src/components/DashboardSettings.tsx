import { Link } from 'react-router-dom';
import type { User } from '../auth/AuthContext';
import './DashboardSettings.css';

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

type Props = {
  user: User;
  onLogout: () => void;
};

export default function DashboardSettings({ user, onLogout }: Props) {
  const daysLeft = trialDaysLeft(user.trialEndsAt);

  return (
    <div className="dash-settings">
      <div className="dash-settings-inner">
        <header className="dash-settings-head">
          <h1>Settings</h1>
          <p>Manage your GeoLoca account</p>
        </header>

        <section className="settings-block">
          <h2>Profile</h2>
          <div className="settings-profile">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="settings-avatar" />
            ) : (
              <span className="settings-avatar settings-avatar-fallback">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </section>

        <section className="settings-block">
          <h2>Plan</h2>
          <div className="settings-row">
            <span>Status</span>
            <strong>{user.trialActive ? `Trial · ${daysLeft} days left` : 'Trial ended'}</strong>
          </div>
          <div className="settings-row">
            <span>Member since</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <a href="/#pricing" className="btn btn-primary settings-btn">
            View pricing
          </a>
        </section>

        <section className="settings-block">
          <h2>Legal</h2>
          <p className="settings-note">All sales are final. We don&apos;t accept refunds.</p>
          <Link to="/#refund-policy" className="settings-link">
            Refund policy
          </Link>
        </section>

        <section className="settings-block">
          <h2>Security</h2>
          <div className="settings-row">
            <span>Sign-in</span>
            <strong>{user.provider === 'google' ? 'Google' : 'Email'}</strong>
          </div>
          <div className="settings-row">
            <span>Session</span>
            <strong className="settings-secure">Secured · HttpOnly cookie</strong>
          </div>
        </section>

        <button type="button" className="btn btn-secondary settings-logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
