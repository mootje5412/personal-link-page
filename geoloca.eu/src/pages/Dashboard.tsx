import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DashboardMap from '../components/DashboardMap';
import DashboardSettings from '../components/DashboardSettings';
import { usePhoneConnection } from '../hooks/usePhoneConnection';
import { useLanguage } from '../i18n/LanguageContext';
import './Dashboard.css';

function trialDaysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

type Tab = 'map' | 'settings';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('map');
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);

  const phone = usePhoneConnection();

  useEffect(() => {
    if (!showWelcome) return;
    const fadeTimer = window.setTimeout(() => setWelcomeLeaving(true), 2600);
    const hideTimer = window.setTimeout(() => setShowWelcome(false), 3000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showWelcome]);

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

  return (
    <div className="dashboard">
      {tab === 'map' ? (
        <>
          <DashboardMap
            connected={phone.connected}
            connectionStatus={phone.status}
            setupStep={phone.setupStep}
            connectedDevice={phone.connectedDevice}
            appliedLocation={phone.appliedLocation}
            applyingLocation={phone.applyingLocation}
            usbError={phone.usbError}
            bridgeOnline={phone.bridgeOnline}
            autoScanning={phone.autoScanning}
            onNextStep={phone.nextStep}
            onPrevStep={phone.prevStep}
            onDetectUsb={phone.detectUsb}
            onRetryUsb={phone.retryUsb}
            onDisconnect={phone.disconnect}
            onCheckBridge={phone.checkBridge}
            onApplyLocation={phone.applyLocation}
          />
          {showWelcome && (
            <div
              className={`dash-welcome-float ${welcomeLeaving ? 'dash-welcome-float--out' : ''}`}
              role="status"
            >
              <p>
                Welcome, <strong>{firstName}</strong>
              </p>
              {user.trialActive && (
                <span>
                  {daysLeft === 1
                    ? t('welcome.trial', { days: daysLeft })
                    : t('welcome.trial_plural', { days: daysLeft })}
                </span>
              )}
              <button
                type="button"
                className="dash-welcome-close"
                onClick={() => setShowWelcome(false)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
        </>
      ) : (
        <DashboardSettings user={user} onLogout={() => logout()} />
      )}

      <nav className="dash-tabs" aria-label="Dashboard navigation">
        <Link to="/" className="dash-tabs-logo">
          Geo<span>Loca</span>
        </Link>
        <div className="dash-tabs-pills">
          <button
            type="button"
            className={`dash-tab ${tab === 'map' ? 'active' : ''}`}
            onClick={() => setTab('map')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 5l6-3 6 3v8l-6 3-6-3V5Z" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {t('nav.map')}
          </button>
          <button
            type="button"
            className={`dash-tab ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {t('nav.settings')}
          </button>
        </div>
      </nav>
    </div>
  );
}
