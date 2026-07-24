import './Hero.css'

const searchTypes = ['TC Kimlik', 'İsim', 'Adres', 'Aile', 'IP', 'E-posta']

const Hero = () => {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="nav-brand">
            <span className="brand-mark">A</span>
            Apex Panel
          </a>
          <nav className="nav-links" aria-label="Ana navigasyon">
            <a href="#features">Özellikler</a>
            <a href="#pricing">Fiyatlar</a>
          </nav>
          <a href="#pricing" className="btn-nav">Erişim Al</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Profesyonel Arama Sistemi
            </div>

            <h1 className="hero-title">
              Gelişmiş
              <span className="hero-title-accent">Türk Arama Paneli</span>
            </h1>

            <p className="hero-description">
              TC kimlik, isim, adres, aile bireyleri, IP ve e-posta
              sorgulama. Hızlı, güvenli ve profesyonel.
            </p>

            <div className="hero-tags">
              {searchTypes.map((type) => (
                <span key={type} className="hero-tag">{type}</span>
              ))}
            </div>

            <div className="hero-cta">
              <a href="#pricing" className="btn btn-primary">
                Aramaya Başla
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#features" className="btn btn-secondary">
                Özellikleri Gör
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">Milyonlarca</div>
                <div className="stat-label">Kayıt</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <div className="stat-value">&lt;100ms</div>
                <div className="stat-label">Yanıt</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
