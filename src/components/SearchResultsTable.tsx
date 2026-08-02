import {
  getResultCellValue,
  getResultTableColumns,
  phoneHref,
  SearchResult,
} from '../services/searchApi'
import './SearchResultsTable.css'

type SearchResultsTableProps = {
  results: SearchResult[]
}

function resultKey(result: SearchResult, index: number): string {
  return `${result.telefon ?? ''}-${result.tc ?? ''}-${result.email ?? ''}-${result.row ?? index}`
}

function EmptyCell() {
  return <span className="search-results-empty">—</span>
}

function renderCell(columnKey: string, value: string, result: SearchResult) {
  if (!value) return <EmptyCell />

  if (columnKey === 'telefon') {
    const phoneLink = phoneHref(result.telefon_sifirli ?? result.telefon ?? value)
    return (
      <div className="search-results-cell-stack">
        {phoneLink ? (
          <a href={phoneLink} className="search-results-link">
            {value}
          </a>
        ) : (
          <span className="search-results-cell-primary">{value}</span>
        )}
      </div>
    )
  }

  if (columnKey === 'email') {
    return (
      <a href={`mailto:${value}`} className="search-results-link">
        {value}
      </a>
    )
  }

  if (columnKey === 'website') {
    const href = value.startsWith('http') ? value : `https://${value}`
    return (
      <a href={href} target="_blank" rel="noreferrer" className="search-results-link">
        {value}
      </a>
    )
  }

  if (columnKey === 'tc' || columnKey === 'telefon_sifirli') {
    return <span className="search-results-mono">{value}</span>
  }

  return <span className="search-results-cell-primary">{value}</span>
}

const SearchResultsTable = ({ results }: SearchResultsTableProps) => {
  const columns = getResultTableColumns(results)

  return (
    <div className="search-results-panel">
      <div className="search-results-toolbar">
        <span>
          <strong>{results.length}</strong> kayıt · <strong>{columns.length}</strong> alan
        </span>
      </div>

      <div className="search-results-table-wrap">
        <table className="search-results-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={resultKey(result, index)}>
                {columns.map((column) => {
                  const value = getResultCellValue(result, column.key)
                  return (
                    <td key={column.key} data-label={column.label}>
                      {renderCell(column.key, value, result)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SearchResultsTable
