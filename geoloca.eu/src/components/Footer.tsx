import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-brand">
        Geo<span>Loca</span>
      </p>
      <p className="footer-copy">&copy; {new Date().getFullYear()} GeoLoca.eu</p>
    </footer>
  );
}
