import { FormEvent, useState } from 'react'
import SearchResultsTable from '../components/SearchResultsTable'
import { useDatabaseStats } from '../context/DatabaseStatsContext'
import { databaseStatusLabel } from '../services/databaseApi'
import { recordLocalSearch } from '../services/localAnalytics'
import {
  ApiSearchType,
  formatSearchMessage,
  queryDatabase,
  SEARCH_PAGE_CONFIG,
  SearchResult,
} from '../services/searchApi'
import './DashboardPage.css'

type QuerySearchPageProps = {
  searchType: ApiSearchType
}

const QuerySearchPage = ({ searchType }: QuerySearchPageProps) => {
  const config = SEARCH_PAGE_CONFIG[searchType]
  const { database, loading: databaseLoading } = useDatabaseStats()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  const indexBusy =
    databaseLoading ||
    (database?.status === 'starting' && (database?.indexed_records ?? 0) === 0)
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
      const data = await queryDatabase(searchType, query.trim())
      setResults(data.results ?? [])
      setMessage(formatSearchMessage(data))
      recordLocalSearch(searchType, query.trim())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sorgu başarısız.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="dashboard-search">
      <header className="dashboard-search-head">
        <p className="dashboard-search-kicker">Sorgu</p>
        <h1>{config.title}</h1>
        <p className="dashboard-search-intro">{config.intro}</p>
      </header>

      <form className="dashboard-search-form" onSubmit={handleSearch}>
        <label className="dashboard-search-label" htmlFor="query-search-input">
          {config.label}
        </label>
        <div className="dashboard-search-row">
          <input
            id="query-search-input"
            type={searchType === 'telefon' ? 'tel' : 'text'}
            inputMode={config.inputMode ?? 'text'}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={config.placeholder}
            maxLength={config.maxLength ?? 120}
            required
            disabled={indexBusy}
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
          <h2 className="dashboard-results-title">Sonuçlar ({results.length})</h2>
          <SearchResultsTable results={results} />
        </section>
      )}
    </div>
  )
}

export default QuerySearchPage
