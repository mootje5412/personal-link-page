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
            Telefon ve veri
            <em> tek panelde</em>
          </h1>

          <p className="hero-lead">
            Telefon, TC kimlik, isim ve adres — hızlı sorgu, temiz panel,
            anında sonuç. Kayıt ol, anahtarını al, hemen başla.
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
              <div className="hero-panel-brand">VeriPanel</div>
              <span className="hero-panel-live">Canlı</span>
            </header>

            <div className="hero-panel-tabs" role="tablist" aria-label="Sorgu türleri">
              <span className="hero-tab active" role="tab" aria-selected="true">Telefon</span>
              <span className="hero-tab" role="tab" aria-selected="false">TC Kimlik</span>
              <span className="hero-tab" role="tab" aria-selected="false">İsim</span>
            </div>

            <div className="hero-panel-search">
              <label className="hero-search-label">Telefon numarası</label>
              <div className="hero-search-row">
                <input readOnly value="05551234567" aria-label="Telefon numarası" />
                <button type="button" className="hero-search-btn">Sorgula</button>
              </div>
            </div>

            <div className="hero-panel-results">
              <div className="hero-results-head">
                <span>Sonuç</span>
                <span className="hero-results-time">0.3sn</span>
              </div>
              <dl className="hero-result-list">
                <div className="hero-result-item">
                  <dt>Ad Soyad</dt>
                  <dd>Ahmet Yılmaz</dd>
                </div>
                <div className="hero-result-item">
                  <dt>Telefon</dt>
                  <dd>0555 123 45 67</dd>
                </div>
                <div className="hero-result-item">
                  <dt>İl</dt>
                  <dd>İstanbul</dd>
                </div>
                <div className="hero-result-item">
                  <dt>TC</dt>
                  <dd>123********</dd>
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
