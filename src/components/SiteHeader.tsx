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
          VeriPanel
        </Link>

        {isHome && (
          <nav className="nav" aria-label="Ana menü">
            <a href="#sorgu">Sorgu</a>
            <a href="#ozellikler">Özellikler</a>
            <a href="#nasil-calisir">Nasıl Çalışır</a>
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
            <div className="header-auth-group">
              <Link to="/giris" className="header-login">Giriş</Link>
              <Link to="/kayit" className="header-cta">Kayıt ol</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
