import { Link } from 'react-router-dom'
import './MobileNav.css'

const MobileNav = () => {
  return (
    <nav className="mobile-nav" aria-label="Mobil menü">
      <a href="#ozellikler">Özellikler</a>
      <a href="#fiyatlar">Fiyatlar</a>
      <Link to="/giris" className="mobile-nav-login">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Giriş
      </Link>
    </nav>
  )
}

export default MobileNav
