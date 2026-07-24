import './Hero.css'

const Hero = () => {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="nav-brand">Apex Panel</a>
          <nav className="nav-links" aria-label="Ana navigasyon">
            <a href="#features">Özellikler</a>
            <a href="#pricing">Fiyatlar</a>
          </nav>
          <a href="#pricing" className="btn-nav">Erişim Al</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-gradient"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Profesyonel Arama Sistemi
            </div>

            <h1 className="hero-title">
              Gelişmiş<br />
              <span className="gradient-text">Türk Arama Paneli</span>
            </h1>

            <p className="hero-description">
              TC kimlik, isim, adres, aile bireyleri, IP ve e-posta
              sorgulama — hızlı, güvenli, profesyonel.
            </p>

            <div className="hero-cta">
              <a href="#pricing" className="btn-large btn-primary">
                Aramaya Başla
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#features" className="btn-large btn-secondary">
                Özellikleri Gör
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">Milyonlarca</div>
                <div className="stat-label">Kayıt</div>
              </div>
              <div className="stat">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat">
                <div className="stat-value">&lt;100ms</div>
                <div className="stat-label">Yanıt</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="search-preview">
              <div className="search-preview-header">
                <span className="search-preview-dot"></span>
                <span>Apex Panel</span>
              </div>
              <div className="search-preview-body">
                <div className="search-preview-tabs">
                  <span className="search-tab active">TC</span>
                  <span className="search-tab">İsim</span>
                  <span className="search-tab">Adres</span>
                  <span className="search-tab">IP</span>
                </div>
                <div className="search-preview-input">
                  <span className="search-input-placeholder">Sorgu girin...</span>
                  <span className="search-input-btn">Ara</span>
                </div>
                <div className="search-preview-results">
                  <div className="result-row"><span>Ad Soyad</span><span>••• •••</span></div>
                  <div className="result-row"><span>Adres</span><span>İstanbul</span></div>
                  <div className="result-row"><span>Aile</span><span>3 kayıt</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
