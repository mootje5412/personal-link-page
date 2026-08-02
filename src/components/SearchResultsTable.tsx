import { phoneHref, SearchResult } from '../services/searchApi'
import './SearchResultsTable.css'

type SearchResultsTableProps = {
  results: SearchResult[]
}

function displayAd(result: SearchResult): string {
  if (result.ad) return result.ad
  if (result.isim) return result.isim.split(/\s+/)[0] ?? ''
  return ''
}

function displaySoyad(result: SearchResult): string {
  if (result.soyad) return result.soyad
  if (result.isim) {
    const parts = result.isim.split(/\s+/)
    if (parts.length > 1) return parts.slice(1).join(' ')
  }
  return ''
}

function resultKey(result: SearchResult, index: number): string {
  return `${result.telefon ?? ''}-${result.tc ?? ''}-${result.email ?? ''}-${result.row ?? index}`
}

function EmptyCell() {
  return <span className="search-results-empty">—</span>
}

const SearchResultsTable = ({ results }: SearchResultsTableProps) => (
  <div className="search-results-panel">
    <div className="search-results-toolbar">
      <span>
        <strong>{results.length}</strong> kayıt gösteriliyor
      </span>
    </div>

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
            const ad = displayAd(result)
            const soyad = displaySoyad(result)
            const phoneLink = result.telefon
              ? phoneHref(result.telefon_sifirli ?? result.telefon)
              : ''

            return (
              <tr key={resultKey(result, index)}>
                <td data-label="Ad">
                  {ad ? (
                    <span className="search-results-cell-primary">{ad}</span>
                  ) : (
                    <EmptyCell />
                  )}
                </td>
                <td data-label="Soyad">
                  {soyad ? (
                    <span className="search-results-cell-primary">{soyad}</span>
                  ) : (
                    <EmptyCell />
                  )}
                </td>
                <td data-label="TC Kimlik">
                  {result.tc ? (
                    <div className="search-results-cell-stack">
                      <span className="search-results-tc">{result.tc}</span>
                      {result.isim && (
                        <span className="search-results-cell-sub">{result.isim}</span>
                      )}
                    </div>
                  ) : (
                    <EmptyCell />
                  )}
                </td>
                <td data-label="Telefon">
                  {result.telefon ? (
                    <div className="search-results-cell-stack">
                      {phoneLink ? (
                        <a href={phoneLink} className="search-results-link">
                          {result.telefon}
                        </a>
                      ) : (
                        <span className="search-results-cell-primary">{result.telefon}</span>
                      )}
                      {result.telefon_uluslararasi && (
                        <span className="search-results-cell-sub">
                          {result.telefon_uluslararasi}
                        </span>
                      )}
                    </div>
                  ) : (
                    <EmptyCell />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

export default SearchResultsTable
