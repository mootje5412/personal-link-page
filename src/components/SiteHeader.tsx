import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import './SiteHeader.css'

const SiteHeader = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="VeriPanel ana sayfa">
          <span className="logo-mark">
            <Logo size={22} />
          </span>
          <span className="logo-text">VeriPanel</span>
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
              <span className="header-user" title={`Anahtar: ${user.keyPrefix ?? '…'}…`}>
                @{user.username}
              </span>
              <button type="button" className="btn btn-ghost header-auth-btn" onClick={logout}>
                Çıkış
              </button>
            </>
          ) : (
            <div className="header-auth-group">
              <Link to="/giris" className="header-login">
                <svg className="header-login-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Giriş
              </Link>
              <Link to="/kayit" className="header-cta">
                Kayıt ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
