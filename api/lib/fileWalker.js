import fs from 'node:fs'
import path from 'node:path'

const SUPPORTED_EXTENSIONS = new Set([
  '.json',
  '.jsonl',
  '.ndjson',
  '.csv',
  '.tsv',
  '.txt',
  '.xlsx',
  '.xls',
])

export function getDatabasesDir(rootDir = process.cwd()) {
  return path.join(rootDir, 'databases')
}

export function listDatabaseFiles(rootDir = process.cwd()) {
  const databasesDir = getDatabasesDir(rootDir)
  if (!fs.existsSync(databasesDir)) {
    fs.mkdirSync(databasesDir, { recursive: true })
    return []
  }

  const files = []

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      const ext = path.extname(entry.name).toLowerCase()
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue

      const stat = fs.statSync(fullPath)
      files.push({
        name: entry.name,
        path: path.relative(databasesDir, fullPath).replace(/\\/g, '/'),
        extension: ext,
        size_bytes: stat.size,
        modified_at: stat.mtime.toISOString(),
      })
    }
  }

  walk(databasesDir)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

export function resolveDatabasePath(relativePath, rootDir = process.cwd()) {
  const databasesDir = path.resolve(getDatabasesDir(rootDir))
  const resolved = path.resolve(databasesDir, relativePath)

  if (!resolved.startsWith(databasesDir + path.sep) && resolved !== databasesDir) {
    throw new Error('Invalid database path')
  }

  return resolved
}
