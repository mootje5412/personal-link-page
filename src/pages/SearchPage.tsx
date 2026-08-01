import { FormEvent, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { SEARCH_TYPE_LABELS, SearchType } from '../services/dashboardApi'
import { recordLocalSearch } from '../services/localAnalytics'
import { formatSearchMessage, queryDatabase, SearchResult } from '../services/searchApi'
import './SearchPage.css'

const VALID_TYPES: SearchType[] = ['tc', 'isim', 'adres', 'telefon', 'aile']

const PLACEHOLDERS: Record<SearchType, string> = {
  tc: '12345678901',
  isim: 'Ahmet Yılmaz',
  adres: 'Kadıköy, İstanbul',
  telefon: '05xxxxxxxxx',
  aile: 'Anne / baba adı',
}

const SearchPage = () => {
  const { type } = useParams<{ type: string }>()
  const searchType = VALID_TYPES.includes(type as SearchType) ? (type as SearchType) : null
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  if (!searchType) {
    return <Navigate to="/panel" replace />
  }

  const activeType = searchType

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setMessage('')
    setResults([])

    try {
      const data = await queryDatabase(activeType, query.trim())
      const searchedQuery = query.trim()
      setResults(data.results ?? [])
      setMessage(formatSearchMessage(data))
      recordLocalSearch(activeType, searchedQuery)
      setQuery('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sorgu başarısız.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="search-page">
      <header className="search-page-head">
        <p className="search-page-label">{SEARCH_TYPE_LABELS[activeType]} sorgusu</p>
        <h1>{SEARCH_TYPE_LABELS[activeType]}</h1>
        <p className="search-page-lead">
          {activeType === 'telefon'
            ? 'Telefon numarası gir — tüm kayıtlar arasında hızlı arama yapılır.'
            : `${SEARCH_TYPE_LABELS[activeType]} bilgisi ile arama yap.`}
        </p>
      </header>

      <section className="search-page-panel">
        <form className="search-page-form" onSubmit={handleSearch}>
          <label className="search-page-field" htmlFor="search-query">
            {activeType === 'telefon' ? 'Telefon numarası' : 'Sorgu'}
          </label>
          <div className="search-page-row">
            <input
              id="search-query"
              type={activeType === 'telefon' || activeType === 'tc' ? 'tel' : 'text'}
              inputMode={activeType === 'tc' || activeType === 'telefon' ? 'numeric' : 'text'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[activeType]}
              maxLength={120}
              required
              autoFocus
            />
            <button type="submit" className="btn" disabled={searching || !query.trim()}>
              {searching ? 'Sorgulanıyor…' : 'Sorgula'}
            </button>
          </div>
          {message && <p className="search-page-msg">{message}</p>}
        </form>
      </section>

      {results.length > 0 && (
        <section className="search-results" aria-label="Arama sonuçları">
          <h2>Sonuçlar</h2>
          <ul className="search-results-list">
            {results.map((row, index) => (
              <li key={`${row.phone}-${row.identity_number}-${index}`} className="search-result-card">
                <p className="search-result-name">{row.full_name || '—'}</p>
                <dl className="search-result-fields">
                  {row.phone && (
                    <div>
                      <dt>Telefon</dt>
                      <dd>{row.phone}</dd>
                    </div>
                  )}
                  {row.identity_number && (
                    <div>
                      <dt>TC</dt>
                      <dd>{row.identity_number}</dd>
                    </div>
                  )}
                  {row.email && (
                    <div>
                      <dt>E-posta</dt>
                      <dd>{row.email}</dd>
                    </div>
                  )}
                  {(row.city || row.country) && (
                    <div>
                      <dt>Konum</dt>
                      <dd>{[row.city, row.country].filter(Boolean).join(', ')}</dd>
                    </div>
                  )}
                  {row.notes && (
                    <div>
                      <dt>Not</dt>
                      <dd>{row.notes}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default SearchPage
