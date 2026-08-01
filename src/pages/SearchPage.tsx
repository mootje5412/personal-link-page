import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { databaseStatusLabel } from '../services/databaseApi'
import { recordLocalSearch } from '../services/localAnalytics'
import { formatSearchMessage, queryDatabase, SearchResult } from '../services/searchApi'
import './SearchPage.css'

const SearchPage = () => {
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
    <div className="search-page">
      <header className="search-page-head">
        <p className="search-page-label">Telefon sorgusu</p>
        <h1>Telefon Sorgu</h1>
        <p className="search-page-lead">
          Telefon numarası gir — veritabanında anında arama yapılır.
        </p>
      </header>

      {indexBusy && (
        <p className="search-page-indexing" role="status">
          Veritabanı durumu: {indexStatus}. İndeks hazır olunca sorgu yapabilirsin.
        </p>
      )}

      <section className="search-page-panel">
        <form className="search-page-form" onSubmit={handleSearch}>
          <label className="search-page-field" htmlFor="search-query">
            Telefon numarası
          </label>
          <div className="search-page-row">
            <input
              id="search-query"
              type="tel"
              inputMode="numeric"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="05xxxxxxxxx"
              maxLength={120}
              required
              disabled={indexBusy}
            />
            <button type="submit" className="btn" disabled={searching || !query.trim() || indexBusy}>
              {searching ? 'Sorgulanıyor…' : 'Sorgula'}
            </button>
          </div>
          {message && <p className="search-page-msg">{message}</p>}
        </form>
      </section>

      {results.length > 0 && (
        <section className="search-results" aria-label="Arama sonuçları">
          <h2>Sonuçlar ({results.length})</h2>

          <div className="search-results-mobile">
            {results.map((row, index) => (
              <article key={`${row.phone}-${row.identity_number}-${index}`} className="search-result-row">
                <div className="search-result-cell">
                  <span>E-posta</span>
                  <strong>{row.email || '—'}</strong>
                </div>
                <div className="search-result-cell">
                  <span>Telefon</span>
                  <strong>{row.phone || '—'}</strong>
                </div>
                <div className="search-result-cell">
                  <span>İsim</span>
                  <strong>{row.full_name || '—'}</strong>
                </div>
                <div className="search-result-cell">
                  <span>Numara</span>
                  <strong>{row.identity_number || '—'}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="search-results-table-wrap search-results-table-wrap--desktop">
            <table className="search-results-table">
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

export function SearchPageRoute() {
  return <SearchPage />
}

export function LegacySearchRedirect({ type }: { type: string | undefined }) {
  if (type && type !== 'telefon') {
    return <Navigate to="/panel/sorgu/telefon" replace />
  }
  return <SearchPage />
}

export default SearchPage
