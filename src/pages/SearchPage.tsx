import { FormEvent, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  SEARCH_TYPE_LABELS,
  SearchType,
  performSearch,
} from '../services/dashboardApi'
import { recordLocalSearch } from '../services/localAnalytics'
import './SearchPage.css'

const VALID_TYPES: SearchType[] = ['tc', 'isim', 'adres', 'telefon', 'aile']

const PLACEHOLDERS: Record<SearchType, string> = {
  tc: '12345678901',
  isim: 'Ahmet Yılmaz',
  adres: 'Kadıköy, İstanbul',
  telefon: '05xx xxx xx xx',
  aile: 'Anne / baba adı',
}

const SearchPage = () => {
  const { type } = useParams<{ type: string }>()
  const searchType = VALID_TYPES.includes(type as SearchType) ? (type as SearchType) : null
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  if (!searchType) {
    return <Navigate to="/panel" replace />
  }

  const activeType = searchType

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setMessage('')

    try {
      const result = await performSearch(activeType, query.trim()) as {
        result?: { durationMs?: number }
      }
      setMessage(`Sorgu tamamlandı · ${result.result?.durationMs ?? 0}ms`)
      setQuery('')
    } catch {
      recordLocalSearch(activeType, query.trim())
      setMessage('Sorgu kaydedildi')
      setQuery('')
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
            ? 'Telefon numarası ile kayıtlı bilgileri sorgula.'
            : `${SEARCH_TYPE_LABELS[activeType]} bilgisi ile arama yap.`}
        </p>
      </header>

      <section className="search-page-panel">
        <form className="search-page-form" onSubmit={handleSearch}>
          <label className="search-page-field" htmlFor="search-query">
            Sorgu
          </label>
          <div className="search-page-row">
            <input
              id="search-query"
              type={activeType === 'telefon' ? 'tel' : 'text'}
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
    </div>
  )
}

export default SearchPage
