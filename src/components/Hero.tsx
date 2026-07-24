import './Hero.css'

const Hero = () => {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">Apex Panel</a>
          <nav className="nav">
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlar">Fiyatlar</a>
          </nav>
          <a href="#fiyatlar" className="header-cta">Başla</a>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Türk arama paneli</h1>
          <p className="hero-lead">
            TC kimlik, isim, adres, aile bireyleri, IP ve e-posta
            sorgulama. Tek panelden, hızlı erişim.
          </p>
          <div className="hero-actions">
            <a href="#fiyatlar" className="btn">Paket seç</a>
            <a href="#ozellikler" className="btn btn-outline">Neler var</a>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
