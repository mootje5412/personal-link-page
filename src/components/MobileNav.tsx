import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './MobileNav.css'

const MobileNav = () => {
  const { user, logout } = useAuth()

  if (user) {
    return (
      <nav className="mobile-nav" aria-label="Mobil menü">
        <Link to="/panel">Panel</Link>
        <Link to="/panel#sorgu">Sorgu</Link>
        <button type="button" className="mobile-nav-accent mobile-nav-logout" onClick={logout}>
          Çıkış
        </button>
      </nav>
    )
  }

  return (
    <nav className="mobile-nav" aria-label="Mobil menü">
      <a href="#sorgu">Sorgu</a>
      <a href="#ozellikler">Özellikler</a>
      <Link to="/giris">Giriş</Link>
      <Link to="/kayit" className="mobile-nav-accent">
        Kayıt ol
      </Link>
    </nav>
  )
}

export default MobileNav
