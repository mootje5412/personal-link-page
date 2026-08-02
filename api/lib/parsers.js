import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

function parseDelimited(text, delimiter) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return []

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

  return rows
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

export function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const relative = path.basename(filePath)

  if (ext === '.json') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    return items.map((item, index) => normalizeRecord(item, relative, index + 1))
  }

  if (ext === '.jsonl' || ext === '.ndjson') {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean)
    return lines.map((line, index) => normalizeRecord(JSON.parse(line), relative, index + 1))
  }

  if (ext === '.csv') {
    const rows = parseDelimited(fs.readFileSync(filePath, 'utf8'), ',')
    return rows.map((row, index) => normalizeRecord(row, relative, index + 1))
  }

  if (ext === '.tsv') {
    const rows = parseDelimited(fs.readFileSync(filePath, 'utf8'), '\t')
    return rows.map((row, index) => normalizeRecord(row, relative, index + 1))
  }

  if (ext === '.txt') {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.trim())
    return lines.map((line, index) => normalizeRecord({ line }, relative, index + 1))
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { cellDates: true })
    const records = []

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      rows.forEach((row, index) => {
        records.push(normalizeRecord({ sheet: sheetName, ...row }, relative, index + 1))
      })
    }

    return records
  }

  throw new Error(`Unsupported file type: ${ext}`)
}
