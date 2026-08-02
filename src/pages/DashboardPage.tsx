import { FormEvent, useState } from 'react'
import SearchResultsTable from '../components/SearchResultsTable'
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
    <div className="dashboard-search">
      <form className="dashboard-search-form" onSubmit={handleSearch}>
        <label className="dashboard-search-label" htmlFor="dashboard-search-input">
          Telefon numarası
        </label>
        <div className="dashboard-search-row">
          <input
            id="dashboard-search-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="05xx xxx xx xx"
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
          <SearchResultsTable results={results} />
        </section>
      )}
    </div>
  )
}

export default DashboardPage
