import './MobileNav.css'

const MobileNav = () => {
  return (
    <nav className="mobile-nav" aria-label="Mobil menü">
      <a href="#ozellikler">Özellikler</a>
      <a href="#fiyatlar">Fiyatlar</a>
      <a href="#fiyatlar" className="mobile-nav-accent">Başla</a>
    </nav>
  )
}

export default MobileNav
