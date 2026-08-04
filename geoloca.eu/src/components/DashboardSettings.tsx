import { Link } from 'react-router-dom';
import type { User } from '../auth/AuthContext';
import { LANGUAGES } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardSettings.css';

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
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
  const { lang, setLang, t } = useLanguage();
  const daysLeft = trialDaysLeft(user.trialEndsAt);
  const locale = lang === 'en' ? 'en-GB' : lang;

  return (
    <div className="dash-settings">
      <div className="dash-settings-inner">
        <header className="dash-settings-head">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </header>

        <section className="settings-block settings-block--language">
          <h2>{t('settings.language')}</h2>
          <p className="settings-note">{t('settings.language_desc')}</p>
          <div className="lang-grid">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`lang-option ${lang === item.code ? 'active' : ''}`}
                onClick={() => setLang(item.code)}
              >
                <span className="lang-flag">{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <h2>{t('settings.profile')}</h2>
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
          <h2>{t('settings.plan')}</h2>
          <div className="settings-row">
            <span>{t('settings.status')}</span>
            <strong>
              {user.trialActive
                ? t('settings.trial', { days: daysLeft })
                : t('settings.trial_ended')}
            </strong>
          </div>
          <div className="settings-row">
            <span>{t('settings.member_since')}</span>
            <strong>{formatDate(user.createdAt, locale)}</strong>
          </div>
          <a href="/#pricing" className="btn btn-primary settings-btn">
            {t('settings.view_pricing')}
          </a>
        </section>

        <section className="settings-block">
          <h2>{t('settings.legal')}</h2>
          <p className="settings-note">{t('settings.no_refunds')}</p>
          <Link to="/#refund-policy" className="settings-link">
            {t('settings.refund_policy')}
          </Link>
        </section>

        <section className="settings-block">
          <h2>{t('settings.security')}</h2>
          <div className="settings-row">
            <span>{t('settings.sign_in')}</span>
            <strong>{user.provider === 'google' ? 'Google' : 'Email'}</strong>
          </div>
          <div className="settings-row">
            <span>{t('settings.session')}</span>
            <strong className="settings-secure">{t('settings.session_secure')}</strong>
          </div>
        </section>

        <button type="button" className="btn btn-secondary settings-logout" onClick={onLogout}>
          {t('settings.logout')}
        </button>
      </div>
    </div>
  );
}
