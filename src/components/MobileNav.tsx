import { Link } from 'react-router-dom'
import './MobileNav.css'

const MobileNav = () => {
  return (
    <nav className="mobile-nav" aria-label="Mobil menü">
      <a href="#ozellikler">Özellikler</a>
      <a href="#fiyatlar">Fiyatlar</a>
      <Link to="/giris" className="mobile-nav-accent">Giriş</Link>
    </nav>
  )
}

export default MobileNav
