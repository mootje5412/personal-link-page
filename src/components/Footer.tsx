import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer section-dark">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <p className="footer-name">
              <span className="footer-logo-mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M4 12h10M4 17h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              VeriPanel
            </p>
            <p className="footer-desc">Türkiye&apos;nin güvenilir veri sorgulama paneli</p>
          </div>
          <div className="footer-links">
            <a href="#sorgu">Sorgu Türleri</a>
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <Link to="/giris">Giriş</Link>
          </div>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} VeriPanel. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  )
}

export default Footer
