import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow" />
      </div>

      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Türkiye&apos;nin veri sorgulama paneli
          </div>

          <h1>
            Her türlü veriyi
            <span className="hero-accent"> anında sorgula</span>
          </h1>

          <p className="hero-lead">
            TC kimlik, isim, adres, telefon, aile bilgisi ve daha fazlası — tek panelde, saniyeler içinde sonuç al.
          </p>

          <div className="hero-actions">
            <Link to="/kayit" className="btn">Hemen başla</Link>
            <a href="#sorgu" className="btn btn-ghost">Paneli incele</a>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item">
              <strong>50K+</strong>
              <span>Günlük sorgu</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <strong>99.9%</strong>
              <span>Uptime</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <strong>7/24</strong>
              <span>Aktif panel</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-panel">
            <div className="hero-panel-bar">
              <span className="hero-panel-dot" />
              <span className="hero-panel-dot" />
              <span className="hero-panel-dot" />
              <span className="hero-panel-title">VeriPanel — Sorgu</span>
            </div>
            <div className="hero-panel-body">
              <div className="hero-search-tabs">
                <span className="hero-tab active">TC Kimlik</span>
                <span className="hero-tab">İsim</span>
                <span className="hero-tab">Adres</span>
              </div>
              <div className="hero-search-input">
                <span>12345678901</span>
                <button type="button" className="hero-search-btn">Ara</button>
              </div>
              <div className="hero-result">
                <div className="hero-result-row">
                  <span className="hero-result-label">Ad Soyad</span>
                  <span className="hero-result-value">Ahmet Yılmaz</span>
                </div>
                <div className="hero-result-row">
                  <span className="hero-result-label">Doğum Yeri</span>
                  <span className="hero-result-value">İstanbul</span>
                </div>
                <div className="hero-result-row">
                  <span className="hero-result-label">Adres</span>
                  <span className="hero-result-value">Kadıköy, İstanbul</span>
                </div>
                <div className="hero-result-row">
                  <span className="hero-result-label">Anne Adı</span>
                  <span className="hero-result-value">Fatma Yılmaz</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
