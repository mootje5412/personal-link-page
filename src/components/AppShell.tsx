import { Link } from 'react-router-dom'
import './AppShell.css'

interface AppShellProps {
  children: React.ReactNode
  header?: React.ReactNode
  dark?: boolean
}

export default function AppShell({ children, header, dark = true }: AppShellProps) {
  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`}>
      {header}
      <main className="app-main">{children}</main>
    </div>
  )
}

export function FeedHeader() {
  return (
    <header className="feed-header">
      <div className="feed-tabs">
        <button type="button" className="feed-tab">Following</button>
        <button type="button" className="feed-tab active">For You</button>
      </div>
      <Link to="/search" className="feed-search" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </Link>
    </header>
  )
}
