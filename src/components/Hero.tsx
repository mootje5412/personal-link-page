import './Hero.css'

const Hero = () => {
  return (
    <>
      <header className="site-header">
        <div className="container header-row">
          <a href="#" className="logo">Apex Panel</a>
          <nav className="nav">
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlar">Fiyatlar</a>
          </nav>
          <a href="#fiyatlar" className="header-btn">Giriş</a>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Apex Panel</h1>
          <p>Türk arama paneli.</p>
          <p className="hero-types">
            TC · İsim · Adres · Aile · IP · E-posta
          </p>
          <a href="#fiyatlar" className="hero-link">Paketleri gör</a>
        </div>
      </section>
    </>
  )
}

export default Hero
