import { Link } from 'react-router-dom'
import { IconArrow } from './icons/SearchIcons'
import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-noise" />
      </div>

      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-status" />
            Canlı · Türkiye geneli veri paneli
          </div>

          <h1>
            Veriyi sorgulamanın
            <em> en hızlı yolu</em>
          </h1>

          <p className="hero-lead">
            TC kimlik, isim, adres, telefon ve aile bilgisi — tüm sorgular tek
            panelde, milisaniyeler içinde sonuçlanır.
          </p>

          <div className="hero-actions">
            <Link to="/kayit" className="btn">
              Hemen başla
              <IconArrow />
            </Link>
            <a href="#sorgu" className="btn btn-ghost">Sorgu türlerini gör</a>
          </div>

          <dl className="hero-metrics">
            <div className="hero-metric">
              <dt>50K+</dt>
              <dd>Günlük sorgu</dd>
            </div>
            <div className="hero-metric">
              <dt>99.9%</dt>
              <dd>Uptime</dd>
            </div>
            <div className="hero-metric">
              <dt>&lt;1sn</dt>
              <dd>Yanıt süresi</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual">
          <div className="hero-panel">
            <header className="hero-panel-header">
              <div className="hero-panel-brand">
                <span className="hero-panel-logo" />
                VeriPanel
              </div>
              <span className="hero-panel-live">Canlı</span>
            </header>

            <div className="hero-panel-tabs" role="tablist" aria-label="Sorgu türleri">
              <span className="hero-tab active" role="tab" aria-selected="true">TC Kimlik</span>
              <span className="hero-tab" role="tab" aria-selected="false">İsim</span>
              <span className="hero-tab" role="tab" aria-selected="false">Adres</span>
            </div>

            <div className="hero-panel-search">
              <label className="hero-search-label">Kimlik numarası</label>
              <div className="hero-search-row">
                <input readOnly value="12345678901" aria-label="TC Kimlik numarası" />
                <button type="button" className="hero-search-btn">Sorgula</button>
              </div>
            </div>

            <div className="hero-panel-results">
              <div className="hero-results-head">
                <span>Sonuç</span>
                <span className="hero-results-time">0.4sn</span>
              </div>
              <dl className="hero-result-list">
                <div className="hero-result-item">
                  <dt>Ad Soyad</dt>
                  <dd>Ahmet Yılmaz</dd>
                </div>
                <div className="hero-result-item">
                  <dt>Doğum Yeri</dt>
                  <dd>İstanbul</dd>
                </div>
                <div className="hero-result-item">
                  <dt>Adres</dt>
                  <dd>Kadıköy, İstanbul</dd>
                </div>
                <div className="hero-result-item">
                  <dt>Anne Adı</dt>
                  <dd>Fatma Yılmaz</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="hero-panel-shadow" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default Hero
