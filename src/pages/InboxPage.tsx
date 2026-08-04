import AppShell from '../components/AppShell'
import './PlaceholderPages.css'

export default function InboxPage() {
  return (
    <AppShell dark={false}>
      <div className="placeholder-page">
        <div className="placeholder-icon">💬</div>
        <h1>Inbox</h1>
        <p>Messages and notifications will appear here.</p>
      </div>
    </AppShell>
  )
}
