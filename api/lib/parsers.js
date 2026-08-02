import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

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

function parseDelimited(text, delimiter) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { rows: [], total_lines: 0, total_data_lines: 0 }

  const lineStats = countTextLines(text)
  const headers = splitDelimitedLine(lines[0], delimiter).map((h, i) => h.trim() || `column_${i + 1}`)
  const rows = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitDelimitedLine(lines[i], delimiter)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    rows.push(row)
  }

  return {
    rows,
    total_lines: lineStats.total_lines,
    total_data_lines: Math.max(lineStats.total_data_lines - 1, 0),
  }
}

function splitDelimitedLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result
}

function flattenValue(value, prefix = '', out = {}) {
  if (value == null) return out

  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenValue(item, prefix ? `${prefix}.${index}` : String(index), out))
    return out
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      flattenValue(nested, prefix ? `${prefix}.${key}` : key, out)
    }
    return out
  }

  out[prefix || 'value'] = String(value)
  return out
}

export function normalizeRecord(record, sourceFile, rowIndex) {
  const flat = flattenValue(record)
  return {
    source_file: sourceFile,
    row_index: rowIndex,
    fields: flat,
    text: Object.values(flat).join(' ').toLowerCase(),
  }
}

export function indexFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const relative = path.basename(filePath)

  if (ext === '.json') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(raw)
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    return {
      records: items.map((item, index) => normalizeRecord(item, relative, index + 1)),
      total_lines: lineStats.total_lines,
      total_data_lines: items.length,
    }
  }

  if (ext === '.jsonl' || ext === '.ndjson') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(raw)
    const lines = raw.split(/\r?\n/).filter(Boolean)
    return {
      records: lines.map((line, index) => normalizeRecord(JSON.parse(line), relative, index + 1)),
      total_lines: lineStats.total_lines,
      total_data_lines: lines.length,
    }
  }

  if (ext === '.csv') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { rows, total_lines, total_data_lines } = parseDelimited(raw, ',')
    return {
      records: rows.map((row, index) => normalizeRecord(row, relative, index + 1)),
      total_lines,
      total_data_lines,
    }
  }

  if (ext === '.tsv') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { rows, total_lines, total_data_lines } = parseDelimited(raw, '\t')
    return {
      records: rows.map((row, index) => normalizeRecord(row, relative, index + 1)),
      total_lines,
      total_data_lines,
    }
  }

  if (ext === '.txt') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(raw)
    const lines = raw.split(/\r?\n/).filter((line) => line.trim())
    return {
      records: lines.map((line, index) => normalizeRecord({ line }, relative, index + 1)),
      total_lines: lineStats.total_lines,
      total_data_lines: lines.length,
    }
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { cellDates: true })
    const records = []
    let total_records = 0

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      total_records += rows.length
      rows.forEach((row, index) => {
        records.push(normalizeRecord({ sheet: sheetName, ...row }, relative, index + 1))
      })
    }

    return {
      records,
      total_lines: total_records,
      total_data_lines: total_records,
    }
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

export function parseFile(filePath) {
  return indexFile(filePath).records
}
