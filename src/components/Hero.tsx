import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-gradient"></div>
      <div className="container">
        <nav className="navbar">
          <a href="#" className="nav-brand">Apex Panel</a>
          <div className="nav-links">
            <a href="#features">Özellikler</a>
            <a href="#pricing">Fiyatlar</a>
          </div>
          <a href="#pricing" className="btn-nav">Erişim Al</a>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Profesyonel Arama Sistemi
          </div>
          
          <h1 className="hero-title">
            Apex Panel<br />
            <span className="gradient-text">Gelişmiş Türk Arama Paneli</span>
          </h1>
          
          <p className="hero-description">
            TC Kimlik, isim, adres, aile bireyleri, IP adresi ve e-posta 
            aramaları için profesyonel ve hızlı çözüm. Güvenli ve 
            güvenilir veri sorgulama platformu.
          </p>

          <div className="hero-cta">
            <a href="#pricing" className="btn-large btn-primary">
              Aramaya Başla
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Çalışma Süresi</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">&lt;100ms</div>
              <div className="stat-label">Ortalama Yanıt</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="code-window">
            <div className="code-header">
              <div className="code-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="code-title">arama_ornegi.ts</span>
            </div>
            <div className="code-content">
              <pre><code><span className="code-comment">// Hızlı arama sorgusu</span>
<span className="code-keyword">const</span> <span className="code-variable">sonuc</span> = <span className="code-keyword">await</span> <span className="code-function">ara</span>({'{'}
  <span className="code-property">tip</span>: <span className="code-string">'TC'</span>,
  <span className="code-property">deger</span>: <span className="code-string">'12345678901'</span>
{'}'});

<span className="code-comment">// Sonuçları al</span>
<span className="code-keyword">const</span> <span className="code-variable">bilgiler</span> = sonuc.<span className="code-property">veri</span>;
console.<span className="code-function">log</span>(bilgiler.<span className="code-property">adSoyad</span>);
console.<span className="code-function">log</span>(bilgiler.<span className="code-property">adres</span>);
console.<span className="code-function">log</span>(bilgiler.<span className="code-property">aileBireyleri</span>);</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
