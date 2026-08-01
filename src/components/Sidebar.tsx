import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
  onLogout: () => void
  username: string
}

const Sidebar = ({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
  username,
}: SidebarProps) => {
  const location = useLocation()

  function isDashboardActive() {
    return location.pathname === '/panel'
  }

  function isPhoneSearchActive() {
    return location.pathname === '/panel/sorgu/telefon'
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Panel menüsü"
      >
        <div className="sidebar-top">
          <Link to="/panel" className="sidebar-brand" onClick={onCloseMobile}>
            <span className="sidebar-brand-text">VeriPanel</span>
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar" aria-hidden="true">
            {username.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{username}</span>
              <span className="sidebar-user-role">Panel</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/panel"
            className={`sidebar-link ${isDashboardActive() ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <span className="sidebar-link-label">Panel</span>
          </Link>

          {!collapsed && <p className="sidebar-section-label">Sorgu</p>}

          <Link
            to="/panel/sorgu/telefon"
            className={`sidebar-link sidebar-search-link ${isPhoneSearchActive() ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <span className="sidebar-link-label">Telefon Sorgu</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link sidebar-logout" onClick={onLogout}>
            <span className="sidebar-link-label">Çıkış</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
