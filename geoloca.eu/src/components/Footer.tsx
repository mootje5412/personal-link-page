import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <p className="footer-brand">
            Geo<span>Loca</span>
          </p>
          <p className="footer-tagline">Change your location. Any country.</p>
          <p className="footer-legal">
            All sales are final. We don&apos;t accept refunds. Cancel anytime to stop future
            charges.
          </p>
        </div>
        <div className="footer-links-col">
          <nav className="footer-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <nav className="footer-nav footer-nav-secondary">
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
            <a href="#refund-policy">Refund policy</a>
          </nav>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} GeoLoca.eu · EUR pricing</p>
      </div>
    </footer>
  );
}
