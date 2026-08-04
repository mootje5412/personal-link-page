import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './BottomNav.css'

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  const hideOn = ['/login', '/register', '/edit-profile']
  if (hideOn.includes(location.pathname)) return null

  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
        <HomeIcon />
        <span>Home</span>
      </NavLink>

      <NavLink to="/discover" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <DiscoverIcon />
        <span>Discover</span>
      </NavLink>

      <NavLink to="/create" className="nav-item nav-create">
        <span className="create-btn">+</span>
      </NavLink>

      <NavLink to="/inbox" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <InboxIcon />
        <span>Inbox</span>
      </NavLink>

      <NavLink
        to={user ? `/profile/${user.username}` : '/login'}
        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
      >
        {user ? (
          <img src={user.avatarUrl} alt="" className="nav-avatar" />
        ) : (
          <ProfileIcon />
        )}
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11l9-8z" />
    </svg>
  )
}

function DiscoverIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
