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

function displayAd(result) {
  if (result.ad) return result.ad
  if (result.isim) return result.isim.split(/\s+/)[0] ?? '—'
  return '—'
}

function displaySoyad(result) {
  if (result.soyad) return result.soyad
  if (result.isim) {
    const parts = result.isim.split(/\s+/)
    if (parts.length > 1) return parts.slice(1).join(' ')
  }
  return '—'
}

function renderResultRow(result) {
  const ad = displayAd(result)
  const soyad = displaySoyad(result)
  const href = result.telefon ? phoneHref(result.telefon_sifirli ?? result.telefon) : ''

  const adCell = ad !== '—'
    ? `<span class="cell-primary">${escapeHtml(ad)}</span>`
    : `<span class="cell-empty">—</span>`

  const soyadCell = soyad !== '—'
    ? `<span class="cell-primary">${escapeHtml(soyad)}</span>`
    : `<span class="cell-empty">—</span>`

  let tcCell = `<span class="cell-empty">—</span>`
  if (result.tc) {
    const sub = result.isim ? `<span class="cell-sub">${escapeHtml(result.isim)}</span>` : ''
    tcCell = `<div class="cell-stack"><span class="cell-tc">${escapeHtml(result.tc)}</span>${sub}</div>`
  }

  let phoneCell = `<span class="cell-empty">—</span>`
  if (result.telefon) {
    const main = href
      ? `<a class="cell-link" href="${escapeHtml(href)}">${escapeHtml(result.telefon)}</a>`
      : `<span class="cell-primary">${escapeHtml(result.telefon)}</span>`
    const sub = result.telefon_uluslararasi
      ? `<span class="cell-sub">${escapeHtml(result.telefon_uluslararasi)}</span>`
      : ''
    phoneCell = `<div class="cell-stack">${main}${sub}</div>`
  }

  return `<tr>
    <td data-label="Ad">${adCell}</td>
    <td data-label="Soyad">${soyadCell}</td>
    <td data-label="TC Kimlik">${tcCell}</td>
    <td data-label="Telefon">${phoneCell}</td>
  </tr>`
}

function renderResultsTable(results) {
  if (!results.length) {
    return `<div class="empty">Sonuç bulunamadı.</div>`
  }

  const rows = results.map((row) => renderResultRow(row)).join('')

  return `<div class="panel">
    <div class="toolbar"><strong>${results.length}</strong> kayıt gösteriliyor</div>
    <div class="table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th>Ad</th>
            <th>Soyad</th>
            <th>TC Kimlik</th>
            <th>Telefon</th>
          </tr>
        </thead>
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
      min-width: 640px;
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
      border-top: 1px solid #e8edf3;
      border-right: 1px solid #e8edf3;
      font-weight: 500;
      vertical-align: middle;
    }
    .results-table td:last-child { border-right: 0; }
    .cell-stack { display: flex; flex-direction: column; gap: 6px; }
    .cell-primary { font-size: 15px; font-weight: 600; color: #0f172a; }
    .cell-sub { font-size: 12px; color: #64748b; }
    .cell-tc { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 15px; font-weight: 600; }
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
      .results-table { min-width: 0; }
      .results-table thead { display: none; }
      .results-table tbody tr {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 12px;
        padding: 14px;
        border-top: 1px solid #eee;
      }
      .results-table td {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0;
        border: 0;
      }
      .results-table td::before {
        content: attr(data-label);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #666;
      }
      .results-table td[data-label="TC Kimlik"],
      .results-table td[data-label="Telefon"] {
        grid-column: 1 / -1;
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
