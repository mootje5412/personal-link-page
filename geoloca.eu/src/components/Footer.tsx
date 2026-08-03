import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p className="footer-logo">GeoLoca.eu</p>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} GeoLoca</p>
      </div>
    </footer>
  );
}
