function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function phoneHref(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90')) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return `tel:${digits}`
}

const FIELD_LABELS = {
  isim: 'İsim',
  ad: 'Ad',
  soyad: 'Soyad',
  telefon: 'Telefon',
  telefon_sifirli: 'Telefon (0)',
  telefon_uluslararasi: 'Telefon (+90)',
  email: 'E-posta',
  tc: 'TC Kimlik',
  sehir: 'Şehir',
  ilce: 'İlçe',
  ulke: 'Ülke',
  adres: 'Adres',
  posta_kodu: 'Posta Kodu',
  sirket: 'Şirket',
  username: 'Kullanıcı Adı',
  website: 'Web Sitesi',
}

const BASE_TABLE_COLUMN_KEYS = [
  'isim',
  'ad',
  'soyad',
  'telefon',
  'telefon_sifirli',
  'telefon_uluslararasi',
  'email',
  'tc',
  'sehir',
  'ilce',
  'ulke',
  'adres',
  'posta_kodu',
  'sirket',
  'username',
  'website',
]

function getResultCellValue(result, columnKey) {
  if (columnKey.startsWith('diger:')) {
    const extraKey = columnKey.slice(6)
    return result.diger?.[extraKey] ?? ''
  }
  const value = result[columnKey]
  return typeof value === 'string' ? value : ''
}

function getResultTableColumns(results) {
  const columns = []
  const seen = new Set()

  for (const key of BASE_TABLE_COLUMN_KEYS) {
    const hasValue = results.some((result) => getResultCellValue(result, key))
    if (!hasValue) continue
    columns.push({ key, label: FIELD_LABELS[key] ?? key })
    seen.add(key)
  }

  const extraKeys = new Set()
  for (const result of results) {
    if (!result.diger) continue
    for (const key of Object.keys(result.diger)) {
      extraKeys.add(key)
    }
  }

  for (const key of [...extraKeys].sort()) {
    const columnKey = `diger:${key}`
    if (seen.has(columnKey)) continue
    columns.push({ key: columnKey, label: key.replace(/_/g, ' ') })
  }

  return columns
}

function renderCell(columnKey, value, result) {
  if (!value) return `<span class="cell-empty">—</span>`

  if (columnKey === 'telefon') {
    const href = phoneHref(result.telefon_sifirli ?? result.telefon ?? value)
    const main = href
      ? `<a class="cell-link" href="${escapeHtml(href)}">${escapeHtml(value)}</a>`
      : `<span class="cell-primary">${escapeHtml(value)}</span>`
    return `<div class="cell-stack">${main}</div>`
  }

  if (columnKey === 'email') {
    return `<a class="cell-link" href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>`
  }

  if (columnKey === 'website') {
    const href = String(value).startsWith('http') ? String(value) : `https://${value}`
    return `<a class="cell-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
  }

  if (columnKey === 'tc' || columnKey === 'telefon_sifirli') {
    return `<span class="cell-mono">${escapeHtml(value)}</span>`
  }

  return `<span class="cell-primary">${escapeHtml(value)}</span>`
}

function renderResultRow(result, columns) {
  const cells = columns
    .map((column) => {
      const value = getResultCellValue(result, column.key)
      return `<td data-label="${escapeHtml(column.label)}">${renderCell(column.key, value, result)}</td>`
    })
    .join('')

  return `<tr>${cells}</tr>`
}

function renderResultsTable(results) {
  if (!results.length) {
    return `<div class="empty">Sonuç bulunamadı.</div>`
  }

  const columns = getResultTableColumns(results)
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const rows = results.map((row) => renderResultRow(row, columns)).join('')

  return `<div class="panel">
    <div class="toolbar"><strong>${results.length}</strong> kayıt · <strong>${columns.length}</strong> alan</div>
    <div class="table-wrap">
      <table class="results-table">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#000000">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #eef2f7;
      color: #0f172a;
      line-height: 1.5;
      padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
    }
    .wrap { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.03em; }
    .lead { color: #666; font-size: 15px; margin-bottom: 20px; }
    .search {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    input[type="tel"], input[type="search"] {
      width: 100%;
      min-height: 52px;
      padding: 14px 16px;
      border: 1px solid #ccc;
      border-radius: 14px;
      font-size: 17px;
      background: #fff;
      -webkit-appearance: none;
    }
    button {
      width: 100%;
      min-height: 52px;
      border: 0;
      border-radius: 14px;
      background: #000;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }
    .meta {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .panel {
      border: 1px solid #dfe3ea;
      border-radius: 8px;
      background: #fff;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .toolbar {
      padding: 14px 18px;
      border-bottom: 1px solid #dfe3ea;
      font-size: 13px;
      color: #64748b;
    }
    .toolbar strong { color: #0f172a; font-weight: 600; }
    .table-wrap { overflow-x: auto; }
    .results-table {
      width: 100%;
      min-width: max-content;
      border-collapse: collapse;
      font-size: 14px;
    }
    .results-table thead { background: #f1f5f9; }
    .results-table th {
      padding: 16px 20px;
      text-align: left;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      border-right: 1px solid #dfe3ea;
      border-bottom: 1px solid #dfe3ea;
    }
    .results-table th:last-child { border-right: 0; }
    .results-table td {
      padding: 22px 20px;
      min-width: 120px;
      max-width: 280px;
      border-top: 1px solid #e8edf3;
      border-right: 1px solid #e8edf3;
      font-weight: 500;
      vertical-align: top;
      word-break: break-word;
    }
    .results-table td:last-child { border-right: 0; }
    .cell-stack { display: flex; flex-direction: column; gap: 6px; }
    .cell-primary { font-size: 15px; font-weight: 600; color: #0f172a; }
    .cell-sub { font-size: 12px; color: #64748b; }
    .cell-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; font-weight: 600; }
    .cell-link { color: #2563eb; font-weight: 600; text-decoration: none; }
    .cell-link:hover { text-decoration: underline; }
    .cell-empty { color: #94a3b8; }
    .empty {
      padding: 20px;
      text-align: center;
      color: #666;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e5e5e5;
    }
    .error {
      padding: 14px 16px;
      margin-bottom: 16px;
      border-radius: 12px;
      background: #fff1f1;
      color: #a40000;
      border: 1px solid #ffc9c9;
    }
    @media (max-width: 640px) {
      .results-table th,
      .results-table td {
        padding: 14px 16px;
        font-size: 13px;
      }
      .results-table td {
        min-width: 100px;
        max-width: 220px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">${body}</div>
</body>
</html>`
}

export function renderHomePage() {
  return pageShell(
    'VeriPanel Arama',
    `<h1>VeriPanel</h1>
<p class="lead">Telefon numarası ile arama yap.</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required autofocus>
  <button type="submit">Sorgula</button>
</form>`,
  )
}

export function renderSearchPage(query, result) {
  if (!result.ok) {
    return pageShell(
      'Arama',
      `<h1>VeriPanel</h1>
<p class="error">${escapeHtml(result.error || 'Sorgu başarısız')}</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" value="${escapeHtml(query)}" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required>
  <button type="submit">Sorgula</button>
</form>`,
    )
  }

  const cards =
    result.results.length > 0
      ? renderResultsTable(result.results)
      : `<div class="empty">Sonuç bulunamadı.</div>`

  const summary =
    result.found > 0
      ? `${result.found} sonuç · ${result.returned} gösteriliyor · ${result.ms}ms`
      : `Sonuç bulunamadı · ${result.ms}ms`

  return pageShell(
    `${query} · VeriPanel`,
    `<h1>VeriPanel</h1>
<p class="lead">Telefon sorgusu</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" value="${escapeHtml(query)}" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required>
  <button type="submit">Sorgula</button>
</form>
<p class="meta">${escapeHtml(summary)}</p>
${cards}`,
  )
}

export function wantsHtml(req) {
  if (req.query.format === 'html') return true
  const accept = String(req.headers.accept ?? '')
  if (accept.includes('text/html') && !accept.includes('application/json')) return true
  return false
}
