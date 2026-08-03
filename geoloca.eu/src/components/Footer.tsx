import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">
            Geo<span>Loca</span>
          </p>
          <p className="footer-tagline">Change your location. Any country.</p>
        </div>
        <nav className="footer-nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <p className="footer-copy">&copy; {new Date().getFullYear()} GeoLoca.eu</p>
      </div>
    </footer>
  );
}
