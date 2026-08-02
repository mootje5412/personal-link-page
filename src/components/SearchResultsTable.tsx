import { phoneHref, SearchResult } from '../services/searchApi'
import './SearchResultsTable.css'

type SearchResultsTableProps = {
  results: SearchResult[]
}

function displayAd(result: SearchResult): string {
  if (result.ad) return result.ad
  if (result.isim) return result.isim.split(/\s+/)[0] ?? ''
  return '—'
}

function displaySoyad(result: SearchResult): string {
  if (result.soyad) return result.soyad
  if (result.isim) {
    const parts = result.isim.split(/\s+/)
    if (parts.length > 1) return parts.slice(1).join(' ')
  }
  return '—'
}

function resultKey(result: SearchResult, index: number): string {
  return `${result.telefon ?? ''}-${result.tc ?? ''}-${result.email ?? ''}-${result.row ?? index}`
}

const SearchResultsTable = ({ results }: SearchResultsTableProps) => (
  <div className="search-results-table-wrap">
    <table className="search-results-table">
      <thead>
        <tr>
          <th>Ad</th>
          <th>Soyad</th>
          <th>TC Kimlik</th>
          <th>Telefon</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, index) => {
          const phoneLink = result.telefon
            ? phoneHref(result.telefon_sifirli ?? result.telefon)
            : ''

          return (
            <tr key={resultKey(result, index)}>
              <td data-label="Ad">{displayAd(result)}</td>
              <td data-label="Soyad">{displaySoyad(result)}</td>
              <td data-label="TC Kimlik">{result.tc || '—'}</td>
              <td data-label="Telefon">
                {result.telefon ? (
                  phoneLink ? (
                    <a href={phoneLink} className="search-results-phone">
                      {result.telefon}
                    </a>
                  ) : (
                    result.telefon
                  )
                ) : (
                  '—'
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export default SearchResultsTable
