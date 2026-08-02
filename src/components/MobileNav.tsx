import { Link, useLocation } from 'react-router-dom'
import './MobileNav.css'

const MobileNav = () => {
  const location = useLocation()
  const onPanel = location.pathname === '/panel'
  const onSearch = location.pathname.startsWith('/panel/sorgu/telefon')

  return (
    <nav className="mobile-nav" aria-label="Mobil menü">
      <Link to="/panel" className={`mobile-nav-link ${onPanel ? 'active' : ''}`}>
        Gösterge Paneli
      </Link>
      <Link to="/panel/sorgu/telefon" className={`mobile-nav-link ${onSearch ? 'active' : ''}`}>
        Telefon Sorgusu
      </Link>
    </nav>
  )
}

export default MobileNav
