import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  AnalyticsSummary,
  SEARCH_TYPE_LABELS,
  SearchType,
  fetchAnalytics,
  performSearch,
} from '../services/dashboardApi'
import { getLocalAnalytics, recordLocalSearch } from '../services/localAnalytics'
import './DashboardPage.css'

const SEARCH_TYPES: SearchType[] = ['tc', 'isim', 'adres', 'telefon', 'aile']

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
  const [searchType, setSearchType] = useState<SearchType>('tc')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
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

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setSearchMessage('')
    try {
      const result = await performSearch(searchType, query.trim()) as {
        result?: { durationMs?: number }
      }
      setSearchMessage(`Sorgu tamamlandı · ${result.result?.durationMs ?? 0}ms`)
      setQuery('')
      await loadAnalytics()
    } catch {
      recordLocalSearch(searchType, query.trim())
      setSearchMessage('Sorgu kaydedildi')
      setQuery('')
      setAnalytics(getLocalAnalytics())
    } finally {
      setSearching(false)
    }
  }

  const displayName = user?.username ?? 'Kullanıcı'

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <p className="dashboard-eyebrow">Hoş geldin</p>
        <h1>Welcome, {displayName}</h1>
        <p className="dashboard-subtitle">
          Sorgu geçmişin ve kullanım istatistiklerin burada. Yeni bir sorgu başlat veya geçmişe göz at.
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

      <div className="dashboard-grid">
        <section className="dashboard-panel" id="sorgu">
          <h2>Yeni sorgu</h2>
          <p className="dashboard-panel-lead">Sorgu türünü seç, arama yap — istatistikler otomatik güncellenir.</p>

          <form className="dashboard-search-form" onSubmit={handleSearch}>
            <div className="dashboard-type-tabs" role="tablist" aria-label="Sorgu türü">
              {SEARCH_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={searchType === type}
                  className={`dashboard-type-tab ${searchType === type ? 'active' : ''}`}
                  onClick={() => setSearchType(type)}
                >
                  {SEARCH_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <label className="dashboard-field" htmlFor="dashboard-query">
              Sorgu
            </label>
            <div className="dashboard-search-row">
              <input
                id="dashboard-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === 'tc'
                    ? '12345678901'
                    : searchType === 'telefon'
                      ? '05xx xxx xx xx'
                      : 'Arama terimi girin'
                }
                maxLength={120}
                required
              />
              <button type="submit" className="btn" disabled={searching || !query.trim()}>
                {searching ? 'Sorgulanıyor…' : 'Sorgula'}
              </button>
            </div>

            {searchMessage && <p className="dashboard-search-msg">{searchMessage}</p>}
          </form>
        </section>

        <section className="dashboard-panel" id="gecmis">
          <h2>Son sorgular</h2>
          {!loading && analytics?.recent.length === 0 && (
            <p className="dashboard-empty">Henüz sorgu yok. İlk aramanı yukarıdan başlat.</p>
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
      </div>

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
