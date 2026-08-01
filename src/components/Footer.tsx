import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer section-dark">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <p className="footer-name">VeriPanel</p>
            <p className="footer-desc">Türkiye&apos;nin güvenilir veri sorgulama paneli</p>
          </div>
          <div className="footer-links">
            <a href="#sorgu">Sorgu Türleri</a>
            <a href="#ozellikler">Özellikler</a>
            <a href="#yukselt">Yükselt</a>
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
