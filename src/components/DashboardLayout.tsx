import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import './DashboardLayout.css'

const SIDEBAR_KEY = 'veripanel_sidebar_collapsed'

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    document.body.classList.add('dashboard-body')
    return () => document.body.classList.remove('dashboard-body')
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className={`dashboard-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
        username={user.username}
      />

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="dashboard-topbar-meta">
            <span className="dashboard-topbar-label">Panel</span>
            <span className="dashboard-topbar-user">@{user.username}</span>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet context={{ refreshKey: 0 }} />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
