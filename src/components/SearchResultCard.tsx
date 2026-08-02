import { useState } from 'react'
import {
  phoneHref,
  RESULT_FIELD_LABELS,
  RESULT_FIELD_ORDER,
  SearchResult,
} from '../services/searchApi'
import './SearchResultCard.css'

type SearchResultCardProps = {
  result: SearchResult
  index: number
}

function renderValue(key: string, value: string) {
  if (key === 'email') {
    return (
      <a href={`mailto:${value}`} className="result-card-link">
        {value}
      </a>
    )
  }

  if (key === 'website') {
    const href = value.startsWith('http') ? value : `https://${value}`
    return (
      <a href={href} target="_blank" rel="noreferrer" className="result-card-link">
        {value}
      </a>
    )
  }

  return value
}

const SearchResultCard = ({ result, index }: SearchResultCardProps) => {
  const [showExtras, setShowExtras] = useState(false)
  const phoneLink = result.telefon ? phoneHref(result.telefon_sifirli ?? result.telefon) : ''
  const extras = result.diger ? Object.entries(result.diger) : []

  return (
    <article className="result-card" aria-label={`Sonuç ${index + 1}`}>
      <header className="result-card-head">
        <h3 className="result-card-name">{result.isim || 'İsimsiz kayıt'}</h3>
        {result.telefon &&
          (phoneLink ? (
            <a href={phoneLink} className="result-card-phone">
              {result.telefon}
            </a>
          ) : (
            <p className="result-card-phone">{result.telefon}</p>
          ))}
      </header>

      <dl className="result-card-fields">
        {RESULT_FIELD_ORDER.map((key) => {
          const value = result[key]
          if (!value) return null

          return (
            <div key={key} className="result-card-field">
              <dt>{RESULT_FIELD_LABELS[key]}</dt>
              <dd>{renderValue(key, value)}</dd>
            </div>
          )
        })}
      </dl>

      {extras.length > 0 && (
        <div className="result-card-extras">
          <button
            type="button"
            className="result-card-extras-toggle"
            aria-expanded={showExtras}
            onClick={() => setShowExtras((open) => !open)}
          >
            {showExtras ? 'Diğer bilgileri gizle' : `Diğer bilgiler (${extras.length})`}
          </button>

          {showExtras && (
            <dl className="result-card-fields result-card-fields--extras">
              {extras.map(([key, value]) => (
                <div key={key} className="result-card-field">
                  <dt>{key.replace(/_/g, ' ')}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </article>
  )
}

export default SearchResultCard
