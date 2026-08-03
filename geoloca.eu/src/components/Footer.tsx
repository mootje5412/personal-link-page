import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-mark">G</span>
          <span>GeoLoca</span>
        </div>
        <nav className="footer-nav">
          <a href="#how">How it works</a>
          <a href="#countries">Countries</a>
          <a href="#setup">Setup</a>
        </nav>
        <p className="footer-copy">&copy; {new Date().getFullYear()} GeoLoca.eu</p>
      </div>
    </footer>
  );
}
