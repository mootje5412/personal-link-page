import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'
import { parseDelimitedFile } from './csvParser.js'
import { buildRecordSearchIndex } from './recordIndex.js'
import { isPostgresqlSqlDump, parsePgCopyHeader, pgCopyRowToFields } from './sqlParser.js'
import { cleanCell, maybeFormatPhone, normalizeHeader } from './valueUtils.js'

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

function stripBom(text) {
  return text.replace(/^\uFEFF/, '')
}

function flattenValue(value, prefix = '', out = {}, depth = 0) {
  if (value == null || depth > 4) return out

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenValue(item, prefix ? `${prefix}_${index}` : String(index), out, depth + 1)
    })
    return out
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const next = prefix ? `${prefix}_${key}` : key
      flattenValue(nested, next, out, depth + 1)
    }
    return out
  }

  const cleaned = String(value).trim()
  if (cleaned) out[prefix || 'value'] = cleaned
  return out
}

function cleanRow(row) {
  const out = {}
  const usedKeys = new Set()

  for (const [key, value] of Object.entries(row)) {
    if (value == null) continue
    const cleaned = cleanCell(value)
    if (!cleaned) continue

    let normalizedKey = normalizeHeader(key, Object.keys(out).length)
    while (usedKeys.has(normalizedKey)) {
      normalizedKey = `${normalizedKey}_${usedKeys.size + 1}`
    }
    usedKeys.add(normalizedKey)

    out[normalizedKey] = maybeFormatPhone(normalizedKey, cleaned)
  }
  return out
}

export function normalizeRecord(fields, sourceFile, rowIndex) {
  return {
    source_file: sourceFile,
    row_index: rowIndex,
    fields,
    search: buildRecordSearchIndex(fields),
  }
}

function extractJsonRecords(parsed) {
  if (Array.isArray(parsed)) return parsed

  if (!parsed || typeof parsed !== 'object') {
    return [{ value: parsed }]
  }

  for (const key of ['data', 'results', 'records', 'items', 'rows', 'users', 'people', 'contacts']) {
    if (Array.isArray(parsed[key])) return parsed[key]
  }

  for (const value of Object.values(parsed)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return value
    }
  }

  return [parsed]
}

function recordsFromRows(rows, relative) {
  return rows.map((row, index) => normalizeRecord(cleanRow(row), relative, index + 1))
}

function consumeSqlLine(line, state) {
  const stripped = line.trim()

  if (!state.inCopy) {
    const parsed = parsePgCopyHeader(line)
    if (parsed) {
      state.columns = parsed.columns
      state.inCopy = true
    }
    return null
  }

  if (stripped === '\\.' || stripped.startsWith('\\.')) {
    state.inCopy = false
    state.columns = []
    return null
  }

  if (!state.columns.length || !stripped) return null
  return pgCopyRowToFields(state.columns, line.split('\t'))
}

function indexPostgresqlSqlFile(filePath, relative) {
  const fd = fs.openSync(filePath, 'r')
  const stat = fs.fstatSync(fd)
  const bufferSize = 64 * 1024
  const buffer = Buffer.alloc(bufferSize)
  const state = { columns: [], inCopy: false }
  const records = []
  let leftover = ''
  let offset = 0

  try {
    while (offset < stat.size) {
      const bytesRead = fs.readSync(fd, buffer, 0, bufferSize, offset)
      if (bytesRead <= 0) break
      offset += bytesRead

      leftover += buffer.toString('utf8', 0, bytesRead)
      let lineEnd = leftover.indexOf('\n')

      while (lineEnd !== -1) {
        let line = leftover.slice(0, lineEnd)
        leftover = leftover.slice(lineEnd + 1)
        if (line.endsWith('\r')) line = line.slice(0, -1)

        const fields = consumeSqlLine(line, state)
        if (fields) {
          records.push(normalizeRecord(cleanRow(fields), relative, records.length + 1))
        }

        lineEnd = leftover.indexOf('\n')
      }
    }

    if (leftover.trim()) {
      const line = leftover.endsWith('\r') ? leftover.slice(0, -1) : leftover
      const fields = consumeSqlLine(line, state)
      if (fields) {
        records.push(normalizeRecord(cleanRow(fields), relative, records.length + 1))
      }
    }
  } finally {
    fs.closeSync(fd)
  }

  if (records.length === 0) {
    throw new Error('No COPY data rows found in PostgreSQL dump')
  }

  return {
    records,
    total_lines: records.length,
    total_data_lines: records.length,
  }
}

function parseLineOrientedText(raw, relative) {
  const text = stripBom(raw)
  const lineStats = countTextLines(text)
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  const delimitedGuess = lines[0]?.includes(',') || lines[0]?.includes(';') || lines[0]?.includes('\t')
  if (delimitedGuess && lines.length > 1) {
    try {
      const parsed = parseDelimitedFile(text)
      if (parsed.rows.length > 0) {
        return {
          records: recordsFromRows(parsed.rows, relative),
          total_lines: parsed.total_lines,
          total_data_lines: parsed.total_data_lines,
        }
      }
    } catch {
      // fall back to plain lines
    }
  }

  return {
    records: lines.map((line, index) => normalizeRecord({ line }, relative, index + 1)),
    total_lines: lineStats.total_lines,
    total_data_lines: lines.length,
  }
}

export function indexFile(filePath, fileType) {
  const ext = fileType || path.extname(filePath).toLowerCase()
  const relative = path.basename(filePath)

  if (ext === '.json') {
    const raw = stripBom(fs.readFileSync(filePath, 'utf8'))
    const lineStats = countTextLines(raw)
    const parsed = JSON.parse(raw)
    const items = extractJsonRecords(parsed)
    const records = items.map((item, index) => {
      const fields = typeof item === 'object' && item !== null ? flattenValue(item) : { value: String(item) }
      return normalizeRecord(fields, relative, index + 1)
    })

    return {
      records,
      total_lines: lineStats.total_lines,
      total_data_lines: items.length,
    }
  }

  if (ext === '.jsonl' || ext === '.ndjson') {
    const raw = stripBom(fs.readFileSync(filePath, 'utf8'))
    const lineStats = countTextLines(raw)
    const lines = raw.split(/\r?\n/).filter(Boolean)
    const records = lines.map((line, index) => {
      const item = JSON.parse(line)
      const fields = typeof item === 'object' && item !== null ? flattenValue(item) : { value: String(item) }
      return normalizeRecord(fields, relative, index + 1)
    })

    return {
      records,
      total_lines: lineStats.total_lines,
      total_data_lines: lines.length,
    }
  }

  if (ext === '.csv') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = parseDelimitedFile(raw)
    return {
      records: recordsFromRows(parsed.rows, relative),
      total_lines: parsed.total_lines,
      total_data_lines: parsed.total_data_lines,
    }
  }

  if (ext === '.tsv') {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = parseDelimitedFile(raw, '\t')
    return {
      records: recordsFromRows(parsed.rows, relative),
      total_lines: parsed.total_lines,
      total_data_lines: parsed.total_data_lines,
    }
  }

  if (ext === '.sql') {
    const sample = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).slice(0, 16384)
    if (isPostgresqlSqlDump(sample)) {
      return indexPostgresqlSqlFile(filePath, relative)
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    return parseLineOrientedText(raw, relative)
  }

  if (ext === '.txt' || ext === '.log' || ext === '.dat' || ext === '.xml' || ext === '.yaml' || ext === '.yml') {
    const raw = fs.readFileSync(filePath, 'utf8')
    return parseLineOrientedText(raw, relative)
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { cellDates: true })
    const records = []
    let total_records = 0
    let total_lines = 0

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, blankrows: false })
      total_records += rows.length
      total_lines += rows.length
      rows.forEach((row, index) => {
        records.push(normalizeRecord(cleanRow({ sheet: sheetName, ...row }), relative, index + 1))
      })
    }

    return {
      records,
      total_lines,
      total_data_lines: total_records,
    }
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

export function parseFile(filePath, fileType) {
  return indexFile(filePath, fileType).records
}
