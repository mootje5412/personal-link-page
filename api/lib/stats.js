import fs from 'node:fs'
import XLSX from 'xlsx'
import { listDatabaseFiles, resolveDatabasePath } from './fileWalker.js'
import { parseFile } from './parsers.js'

function countTextLines(text) {
  if (!text) return { total_lines: 0, total_data_lines: 0 }
  const lines = text.split(/\r?\n/)
  const total_lines = lines.length
  const total_data_lines = lines.filter((line) => line.trim()).length
  return { total_lines, total_data_lines }
}

export function countFileLines(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()

  if (ext === '.json') {
    const text = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(text)
    try {
      const parsed = JSON.parse(text)
      const records = Array.isArray(parsed) ? parsed.length : 1
      return { ...lineStats, indexed_records: records }
    } catch {
      return { ...lineStats, indexed_records: 0 }
    }
  }

  if (ext === '.jsonl' || ext === '.ndjson' || ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(text)
    return { ...lineStats, indexed_records: lineStats.total_data_lines }
  }

  if (ext === '.csv' || ext === '.tsv') {
    const text = fs.readFileSync(filePath, 'utf8')
    const lineStats = countTextLines(text)
    const dataLines = Math.max(lineStats.total_data_lines - 1, 0)
    return {
      total_lines: lineStats.total_lines,
      total_data_lines: dataLines,
      indexed_records: dataLines,
    }
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { cellDates: true })
    let indexed_records = 0
    for (const sheetName of workbook.SheetNames) {
      indexed_records += XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }).length
    }
    return {
      total_lines: indexed_records,
      total_data_lines: indexed_records,
      indexed_records,
    }
  }

  const text = fs.readFileSync(filePath, 'utf8')
  const lineStats = countTextLines(text)
  return { ...lineStats, indexed_records: lineStats.total_data_lines }
}

export function getLineStats(rootDir = process.cwd()) {
  const files = listDatabaseFiles(rootDir)
  let total_lines = 0
  let total_data_lines = 0
  let total_records = 0

  for (const file of files) {
    try {
      const fullPath = resolveDatabasePath(file.path, rootDir)
      const lines = countFileLines(fullPath)
      const parsed = parseFile(fullPath)

      total_lines += lines.total_lines
      total_data_lines += lines.total_data_lines
      total_records += parsed.length
    } catch {
      // skip unreadable files
    }
  }

  return {
    ok: true,
    stats: {
      total_lines,
      total_data_lines,
      indexed_records: total_records,
      status: 'ready',
    },
  }
}
