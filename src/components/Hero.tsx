import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-grid-lines" />
        </div>
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="hero-label">Türk arama paneli</p>
            <h1>
              Veriyi hızlı<br />
              sorgula
            </h1>
            <p className="hero-lead">
              TC, isim, adres, aile, IP ve e-posta — günlük binlerce arama, tek panelde.
            </p>
            <div className="hero-actions">
              <a href="#fiyatlar" className="btn">Paket seç</a>
              <a href="#ozellikler" className="btn btn-ghost">Detaylar</a>
            </div>
          </div>

          <div className="hero-bento" aria-hidden="true">
            <div className="bento-card bento-main">TC Kimlik</div>
            <div className="bento-card">İsim</div>
            <div className="bento-card">Adres</div>
            <div className="bento-card">Aile</div>
            <div className="bento-card">IP</div>
            <div className="bento-card bento-wide">E-posta</div>
          </div>
        </div>
      </section>
  )
}

export default Hero
