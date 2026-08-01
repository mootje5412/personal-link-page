import { FormEvent, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  SEARCH_TYPE_LABELS,
  SearchType,
  performSearch,
} from '../services/dashboardApi'
import { recordLocalSearch } from '../services/localAnalytics'
import { PhoneSearchResult, searchPhoneNumber } from '../services/phoneApi'
import { isApiUnavailableError } from '../services/validation'
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
  const [phoneResults, setPhoneResults] = useState<PhoneSearchResult[]>([])

  if (!searchType) {
    return <Navigate to="/panel" replace />
  }

  const activeType = searchType
  const isPhoneSearch = activeType === 'telefon'

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setMessage('')
    setPhoneResults([])

    try {
      if (isPhoneSearch) {
        const data = await searchPhoneNumber(query.trim())
        setPhoneResults(data.results ?? [])
        setMessage(
          data.found > 0
            ? `${data.found} sonuç bulundu · ${data.ms}ms`
            : 'Sonuç bulunamadı'
        )
        recordLocalSearch('telefon', query.trim())
      } else {
        const result = await performSearch(activeType, query.trim()) as {
          message?: string
          result?: { durationMs?: number }
        }
        setMessage(
          result.message
            ?? `Sorgu tamamlandı · ${result.result?.durationMs ?? 0}ms`
        )
      }
      setQuery('')
    } catch (err) {
      if (isPhoneSearch) {
        setMessage(err instanceof Error ? err.message : 'Telefon sorgusu başarısız.')
        return
      }

      if (isApiUnavailableError(err)) {
        recordLocalSearch(activeType, query.trim())
        setMessage('Sorgu geçmişe eklendi. Bu sorgu türü henüz aktif değil.')
        setQuery('')
        return
      }

      setMessage(err instanceof Error ? err.message : 'Sorgu başarısız.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="search-page">
      <header className="search-page-head">
        <p className="search-page-label">{SEARCH_TYPE_LABELS[activeType]} sorgusu</p>
        <h1>{isPhoneSearch ? 'Telefon Sorgu' : SEARCH_TYPE_LABELS[activeType]}</h1>
        <p className="search-page-lead">
          {isPhoneSearch
            ? 'Telefon numarası gir — tüm kayıtlar arasında hızlı arama yapılır.'
            : `${SEARCH_TYPE_LABELS[activeType]} bilgisi ile arama yap.`}
        </p>
      </header>

      <section className="search-page-panel">
        <form className="search-page-form" onSubmit={handleSearch}>
          <label className="search-page-field" htmlFor="search-query">
            {isPhoneSearch ? 'Telefon numarası' : 'Sorgu'}
          </label>
          <div className="search-page-row">
            <input
              id="search-query"
              type={isPhoneSearch ? 'tel' : 'text'}
              inputMode={activeType === 'tc' || isPhoneSearch ? 'numeric' : 'text'}
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

      {isPhoneSearch && phoneResults.length > 0 && (
        <section className="search-results" aria-label="Arama sonuçları">
          <h2>Sonuçlar</h2>
          <ul className="search-results-list">
            {phoneResults.map((row, index) => (
              <li key={`${row.phone}-${index}`} className="search-result-card">
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
