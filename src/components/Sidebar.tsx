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

const navItems = [
  { to: '/panel', label: 'Genel Bakış', end: true },
  { to: '/panel#sorgu', label: 'Yeni Sorgu', hash: true },
  { to: '/panel#gecmis', label: 'Geçmiş', hash: true },
]

const Sidebar = ({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
  username,
}: SidebarProps) => {
  const location = useLocation()

  function isActive(path: string) {
    if (path === '/panel') {
      return location.pathname === '/panel' && !location.hash
    }
    return location.pathname === '/panel' && location.hash === path.replace('/panel', '')
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
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link" onClick={onCloseMobile}>
            <span className="sidebar-link-label">Ana sayfa</span>
          </Link>
          <button type="button" className="sidebar-link sidebar-logout" onClick={onLogout}>
            <span className="sidebar-link-label">Çıkış</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
