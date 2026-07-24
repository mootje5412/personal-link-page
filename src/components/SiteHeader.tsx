import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './SiteHeader.css'

const SiteHeader = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">A</span>
          Apex Panel
        </Link>

        {isHome && (
          <nav className="nav">
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlar">Fiyatlar</a>
          </nav>
        )}

        <div className="header-actions">
          {user ? (
            <>
              <span className="header-user">@{user.username}</span>
              <button type="button" className="btn btn-ghost header-auth-btn" onClick={logout}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/giris" className="btn btn-ghost header-auth-btn">
                Giriş
              </Link>
              <Link to="/kayit" className="header-cta">
                Kayıt ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
