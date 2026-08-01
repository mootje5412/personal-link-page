import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  AnalyticsSummary,
  SEARCH_TYPE_LABELS,
  SearchType,
  fetchAnalytics,
} from '../services/dashboardApi'
import { getLocalAnalytics } from '../services/localAnalytics'
import './DashboardPage.css'

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchAnalytics()
      setAnalytics(data)
      setError('')
    } catch {
      setAnalytics(getLocalAnalytics())
      setError('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const displayName = user?.username ?? 'Kullanıcı'

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <h1>Hoş geldin, {displayName}</h1>
        <p className="dashboard-subtitle">
          Sorgu geçmişin ve kullanım istatistiklerin burada. Sol menüden bir sorgu türü seç.
        </p>
      </header>

      {error && <p className="dashboard-error" role="alert">{error}</p>}

      <section className="dashboard-stats" aria-label="Sorgu analitiği">
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Toplam sorgu</span>
          <strong className="dashboard-stat-value">{loading ? '—' : analytics?.total ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bugün</span>
          <strong className="dashboard-stat-value">{loading ? '—' : analytics?.today ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bu hafta</span>
          <strong className="dashboard-stat-value">{loading ? '—' : analytics?.week ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bu ay</span>
          <strong className="dashboard-stat-value">{loading ? '—' : analytics?.month ?? 0}</strong>
        </article>
      </section>

      <section className="dashboard-panel">
        <h2>Son sorgular</h2>
        {!loading && analytics?.recent.length === 0 && (
          <p className="dashboard-empty">Henüz sorgu yok. Sol menüden bir sorgu başlat.</p>
        )}

        <ul className="dashboard-recent-list">
          {(analytics?.recent ?? []).map((item, index) => (
            <li key={`${item.createdAt}-${index}`}>
              <div>
                <span className="dashboard-recent-type">
                  {SEARCH_TYPE_LABELS[item.type as SearchType] ?? item.type}
                </span>
                <span className="dashboard-recent-query">{item.query}</span>
              </div>
              <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            </li>
          ))}
        </ul>
      </section>

      {analytics && analytics.byType.length > 0 && (
        <section className="dashboard-panel dashboard-breakdown">
          <h2>Türe göre dağılım</h2>
          <div className="dashboard-breakdown-grid">
            {analytics.byType.map((item) => (
              <div key={item.type} className="dashboard-breakdown-item">
                <span>{SEARCH_TYPE_LABELS[item.type as SearchType] ?? item.type}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default DashboardPage
