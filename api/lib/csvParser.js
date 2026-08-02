import XLSX from 'xlsx'
import { cleanCell, maybeFormatPhone, normalizeHeader } from './valueUtils.js'

function stripBom(text) {
  return text.replace(/^\uFEFF/, '')
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? ''
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
    '|': (firstLine.match(/\|/g) ?? []).length,
  }

  let best = ','
  let bestCount = counts[',']
  for (const [delimiter, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }
  return best
}

function countTextLines(text) {
  if (!text) return { total_lines: 0, total_data_lines: 0 }

  let total_lines = 0
  let total_data_lines = 0
  let lineStart = 0

  for (let i = 0; i <= text.length; i += 1) {
    if (i === text.length || text[i] === '\n') {
      total_lines += 1
      let end = i
      if (end > lineStart && text[end - 1] === '\r') end -= 1
      if (end > lineStart && text.slice(lineStart, end).trim()) {
        total_data_lines += 1
      }
      lineStart = i + 1
    }
  }

  return { total_lines, total_data_lines }
}

function normalizeRow(row) {
  const out = {}
  const usedKeys = new Set()

  for (const [key, value] of Object.entries(row)) {
    let finalKey = normalizeHeader(key, Object.keys(out).length)
    while (usedKeys.has(finalKey)) {
      finalKey = `${finalKey}_${usedKeys.size + 1}`
    }
    usedKeys.add(finalKey)

    const cleanedValue = cleanCell(value)
    if (!cleanedValue) continue
    out[finalKey] = maybeFormatPhone(finalKey, cleanedValue)
  }
  return out
}

export function parseDelimitedFile(raw, delimiter) {
  const text = stripBom(raw)
  const lineStats = countTextLines(text)
  const resolvedDelimiter = delimiter ?? detectDelimiter(text)

  const workbook = XLSX.read(text, {
    type: 'string',
    FS: resolvedDelimiter,
    codepage: 65001,
  })

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
    blankrows: false,
  })

  const normalizedRows = rows.map(normalizeRow).filter((row) => Object.keys(row).length > 0)

  return {
    rows: normalizedRows,
    total_lines: lineStats.total_lines,
    total_data_lines: Math.max(normalizedRows.length, lineStats.total_data_lines - 1),
    delimiter: resolvedDelimiter,
  }
}
