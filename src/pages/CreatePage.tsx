import AppShell from '../components/AppShell'
import './PlaceholderPages.css'

export default function CreatePage() {
  return (
    <AppShell dark={false}>
      <div className="placeholder-page">
        <div className="placeholder-icon">📹</div>
        <h1>Create</h1>
        <p>Upload and share your videos — coming soon.</p>
      </div>
    </AppShell>
  )
}
