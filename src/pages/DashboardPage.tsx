import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { SEARCH_TYPE_LABELS, SearchType } from '../services/dashboardApi'
import { databaseStatusLabel, formatCount } from '../services/databaseApi'
import { getLocalAnalytics, RECENT_SEARCH_LIMIT } from '../services/localAnalytics'
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
  const location = useLocation()
  const { database, loading: databaseLoading, error: databaseError, reload } = useDatabaseStats()
  const [recent, setRecent] = useState(getLocalAnalytics().recent)

  const loadRecent = useCallback(() => {
    setRecent(getLocalAnalytics().recent.slice(0, RECENT_SEARCH_LIMIT))
  }, [])

  useEffect(() => {
    loadRecent()
    reload()
  }, [loadRecent, reload, location.pathname])

  useEffect(() => {
    const refresh = () => {
      loadRecent()
      reload()
    }
    window.addEventListener('veripanel:search-recorded', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('veripanel:search-recorded', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [loadRecent, reload])

  const displayName = user?.username ?? 'Kullanıcı'

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <h1>Hoş geldin, {displayName}</h1>
        <p className="dashboard-subtitle">
          Veritabanı istatistikleri ve son telefon sorguların burada. Sol menüden telefon sorgusu yap.
        </p>
      </header>

      {databaseError && <p className="dashboard-error" role="alert">{databaseError}</p>}

      <section className="dashboard-stats" aria-label="Veritabanı istatistikleri">
        <article className="dashboard-stat-card dashboard-stat-card--highlight">
          <span className="dashboard-stat-label">Veri satırı</span>
          <strong className="dashboard-stat-value">
            {databaseLoading ? '—' : formatCount(database?.total_data_lines)}
          </strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Toplam satır</span>
          <strong className="dashboard-stat-value">
            {databaseLoading ? '—' : formatCount(database?.total_lines)}
          </strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">İndekslenen kayıt</span>
          <strong className="dashboard-stat-value">
            {databaseLoading ? '—' : formatCount(database?.indexed_records ?? 0)}
          </strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Durum</span>
          <strong className="dashboard-stat-value dashboard-stat-value--status">
            {databaseLoading
              ? '—'
              : databaseStatusLabel(database?.status ?? 'starting', database?.index_building ?? false)}
          </strong>
        </article>
      </section>

      <section className="dashboard-panel">
        <h2>Son sorgular</h2>
        <p className="dashboard-panel-lead">En son {RECENT_SEARCH_LIMIT} telefon sorgusu.</p>
        {recent.length === 0 && (
          <p className="dashboard-empty">Henüz sorgu yok. Sol menüden telefon sorgusu başlat.</p>
        )}

        <ul className="dashboard-recent-list">
          {recent.slice(0, RECENT_SEARCH_LIMIT).map((item, index) => (
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
    </div>
  )
}

export default DashboardPage
