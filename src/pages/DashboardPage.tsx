import { FormEvent, useState } from 'react'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { databaseStatusLabel } from '../services/databaseApi'
import { recordLocalSearch } from '../services/localAnalytics'
import { formatSearchMessage, queryDatabase, SearchResult } from '../services/searchApi'
import './DashboardPage.css'

const DashboardPage = () => {
  const { database, loading: databaseLoading } = useDatabaseStats()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  const indexBusy = databaseLoading || database?.index_building || database?.status !== 'ready'
  const indexStatus = databaseLoading
    ? 'Veritabanı durumu kontrol ediliyor…'
    : databaseStatusLabel(database?.status ?? 'starting', database?.index_building ?? false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim() || indexBusy) return

    setSearching(true)
    setMessage('')
    setResults([])

    try {
      const data = await queryDatabase('telefon', query.trim())
      const searchedQuery = query.trim()
      setResults(data.results ?? [])
      setMessage(formatSearchMessage(data))
      recordLocalSearch('telefon', searchedQuery)
      setQuery('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Telefon sorgusu başarısız.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="dashboard-search">
      <form className="dashboard-search-form" onSubmit={handleSearch}>
        <label className="dashboard-search-label" htmlFor="dashboard-search-input">
          Telefon numarası
        </label>
        <div className="dashboard-search-row">
          <input
            id="dashboard-search-input"
            type="tel"
            inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="05xxxxxxxxx"
            maxLength={120}
            required
            disabled={indexBusy}
            autoFocus
          />
          <button type="submit" className="btn" disabled={searching || !query.trim() || indexBusy}>
            {searching ? 'Sorgulanıyor…' : 'Sorgula'}
          </button>
        </div>
        {indexBusy && (
          <p className="dashboard-search-indexing" role="status">
            {indexStatus} — indeks hazır olunca sorgu yapabilirsin.
          </p>
        )}
        {message && <p className="dashboard-search-msg">{message}</p>}
      </form>

      {results.length > 0 && (
        <section className="dashboard-results" aria-label="Arama sonuçları">
          <div className="dashboard-results-mobile">
            {results.map((row, index) => (
              <article key={`${row.phone}-${row.identity_number}-${index}`} className="dashboard-result-row">
                <div className="dashboard-result-cell">
                  <span>E-posta</span>
                  <strong>{row.email || '—'}</strong>
                </div>
                <div className="dashboard-result-cell">
                  <span>Telefon</span>
                  <strong>{row.phone || '—'}</strong>
                </div>
                <div className="dashboard-result-cell">
                  <span>İsim</span>
                  <strong>{row.full_name || '—'}</strong>
                </div>
                <div className="dashboard-result-cell">
                  <span>Numara</span>
                  <strong>{row.identity_number || '—'}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-results-table-wrap">
            <table className="dashboard-results-table">
              <thead>
                <tr>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>İsim</th>
                  <th>Numara</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={`${row.phone}-${row.identity_number}-${index}`}>
                    <td>{row.email || '—'}</td>
                    <td>{row.phone || '—'}</td>
                    <td>{row.full_name || '—'}</td>
                    <td>{row.identity_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default DashboardPage
