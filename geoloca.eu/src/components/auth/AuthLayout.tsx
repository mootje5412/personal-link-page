import { Link } from 'react-router-dom';
import './AuthLayout.css';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel-brand">
        <Link to="/" className="auth-logo">
          Geo<span>Loca</span>
        </Link>
        <div className="auth-brand-copy">
          <h1>Your location, anywhere.</h1>
          <p>
            Connect phone to laptop, pick a country, and every app follows — Snap, Maps, and
            more.
          </p>
        </div>
        <ul className="auth-brand-list">
          <li>Free 3-day trial</li>
          <li>195+ countries</li>
          <li>No root required</li>
        </ul>
        <div className="auth-brand-glow" aria-hidden />
      </div>

      <div className="auth-panel auth-panel-form">
        <Link to="/" className="auth-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Back to home
        </Link>

        <div className="auth-card">
          <div className="auth-card-head">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
          <div className="auth-card-foot">{footer}</div>
        </div>
      </div>
    </div>
  );
}
