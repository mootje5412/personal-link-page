import { useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DatabaseStatsProvider } from '../context/DatabaseStatsContext'
import './DashboardLayout.css'

function DashboardShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
    <div className="dashboard-shell">
      <header className="dashboard-navbar">
        <Link to="/panel" className="dashboard-navbar-brand">
          VeriPanel
        </Link>

        <div className="dashboard-navbar-actions">
          <span className="dashboard-navbar-user">@{user.username}</span>
          <button type="button" className="dashboard-navbar-logout" onClick={handleLogout}>
            Çıkış
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <Outlet />
      </main>
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
