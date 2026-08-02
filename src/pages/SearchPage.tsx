import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import SearchResultsTable from '../components/SearchResultsTable'
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
      setResults(data.results ?? [])
      setMessage(formatSearchMessage(data))
      recordLocalSearch('telefon', query.trim())
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
              inputMode="tel"
              autoComplete="tel"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="05xx xxx xx xx"
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
          <SearchResultsTable results={results} />
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
