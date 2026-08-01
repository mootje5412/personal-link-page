import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import {
  AnalyticsSummary,
  SEARCH_TYPE_LABELS,
  SearchType,
} from '../services/dashboardApi'
import { databaseStatusLabel, formatCount } from '../services/databaseApi'
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
  const location = useLocation()
  const { database, loading: databaseLoading, error: databaseError } = useDatabaseStats()
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

  const loadAnalytics = useCallback(() => {
    setAnalytics(getLocalAnalytics())
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics, location.pathname])

  useEffect(() => {
    const onRecorded = () => loadAnalytics()
    window.addEventListener('veripanel:search-recorded', onRecorded)
    window.addEventListener('focus', onRecorded)
    return () => {
      window.removeEventListener('veripanel:search-recorded', onRecorded)
      window.removeEventListener('focus', onRecorded)
    }
  }, [loadAnalytics])

  const displayName = user?.username ?? 'Kullanıcı'
  const stats = analytics

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <h1>Hoş geldin, {displayName}</h1>
        <p className="dashboard-subtitle">
          Sorgu geçmişin ve kullanım istatistiklerin burada. Sol menüden telefon sorgusu yap.
        </p>
        {!databaseLoading && database?.total_data_lines != null && (
          <p className="dashboard-data-summary">
            Veritabanında şu an{' '}
            <strong>{formatCount(database.total_data_lines)}</strong> veri satırı var
            {database.indexed_records > 0 && (
              <> — <strong>{formatCount(database.indexed_records)}</strong> kayıt aranabilir</>
            )}
            .
          </p>
        )}
      </header>

      {databaseError && <p className="dashboard-error" role="alert">{databaseError}</p>}

      <section className="dashboard-panel dashboard-database" aria-label="Veritabanı durumu">
        <h2>Veritabanı</h2>
        <p className="dashboard-panel-lead">
          Sunucudaki toplam veri satırı ve indeks durumu.
        </p>
        <div className="dashboard-stats dashboard-stats--database">
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
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Sorgu analitiği">
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Toplam sorgu</span>
          <strong className="dashboard-stat-value">{stats?.total ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bugün</span>
          <strong className="dashboard-stat-value">{stats?.today ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bu hafta</span>
          <strong className="dashboard-stat-value">{stats?.week ?? 0}</strong>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-label">Bu ay</span>
          <strong className="dashboard-stat-value">{stats?.month ?? 0}</strong>
        </article>
      </section>

      <section className="dashboard-panel">
        <h2>Son sorgular</h2>
        {stats?.recent.length === 0 && (
          <p className="dashboard-empty">Henüz sorgu yok. Sol menüden telefon sorgusu başlat.</p>
        )}

        <ul className="dashboard-recent-list">
          {(stats?.recent ?? []).map((item, index) => (
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
