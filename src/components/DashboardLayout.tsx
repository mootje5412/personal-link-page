import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { DatabaseStatsProvider } from '../context/DatabaseStatsContext'
import './DashboardLayout.css'

function pageTitle(pathname: string) {
  if (pathname.startsWith('/panel/sorgu/telefon')) return 'Telefon sorgusu'
  return 'Gösterge paneli'
}

function DashboardShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add('dashboard-body')
    return () => document.body.classList.remove('dashboard-body')
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
        onToggleCollapse={() => setCollapsed((value) => !value)}
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
            ☰
          </button>
          <h1 className="dashboard-topbar-title">{pageTitle(location.pathname)}</h1>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const DashboardLayout = () => {
  const { user } = useAuth()
  if (!user) return null

  return (
    <DatabaseStatsProvider>
      <DashboardShell />
    </DatabaseStatsProvider>
  )
}

export default DashboardLayout
