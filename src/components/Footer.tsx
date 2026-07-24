import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-footer">
              Apex Panel
            </div>
            <p className="footer-tagline">
              Profesyonel Türk arama paneli. TC kimlik, isim, adres, 
              aile bireyleri, IP ve e-posta sorgulama sistemi.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><a href="#features">Özellikler</a></li>
                <li><a href="#about">Hakkında</a></li>
                <li><a href="#contact">İletişim</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Arama Türleri</h4>
              <ul>
                <li><a href="#tc">TC Kimlik</a></li>
                <li><a href="#name">İsim Arama</a></li>
                <li><a href="#address">Adres Sorgulama</a></li>
                <li><a href="#email">E-posta Arama</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Yasal</h4>
              <ul>
                <li><a href="/privacy">Gizlilik Politikası</a></li>
                <li><a href="/terms">Kullanım Şartları</a></li>
                <li><a href="/legal">Yasal Uyarı</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Apex Panel. Tüm hakları saklıdır.</p>
          <div className="footer-badges">
            <span className="footer-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M10 1L12.5 7.5L19 8L14 12.5L15.5 19L10 15.5L4.5 19L6 12.5L1 8L7.5 7.5L10 1Z" fill="currentColor"/>
              </svg>
              Güvenilir Sistem
            </span>
            <span className="footer-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 8V5C6 3.34315 7.34315 2 9 2H11C12.6569 2 14 3.34315 14 5V8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Şifreli Bağlantı
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
