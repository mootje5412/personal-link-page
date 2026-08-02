import fs from 'node:fs'
import path from 'node:path'

const EXTENSIONS = new Set([
  '.json',
  '.jsonl',
  '.ndjson',
  '.csv',
  '.tsv',
  '.txt',
  '.xlsx',
  '.xls',
  '.xml',
  '.sql',
  '.log',
  '.dat',
  '.yaml',
  '.yml',
])

const SKIP_NAMES = new Set(['.gitkeep', '.ds_store', 'thumbs.db'])

export function getDatabasesDir(rootDir = process.cwd()) {
  return path.join(rootDir, 'databases')
}

function detectType(fullPath) {
  const ext = path.extname(fullPath).toLowerCase()
  if (EXTENSIONS.has(ext)) return ext

  const fd = fs.openSync(fullPath, 'r')
  try {
    const buffer = Buffer.alloc(8)
    fs.readSync(fd, buffer, 0, 8, 0)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) return '.xlsx'
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf) return '.xls'
  } finally {
    fs.closeSync(fd)
  }

  const sample = fs.readFileSync(fullPath, 'utf8').trimStart().slice(0, 1)
  if (sample === '{' || sample === '[') return '.json'

  return '.txt'
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
      if (entry.name.startsWith('.')) continue
      if (SKIP_NAMES.has(entry.name.toLowerCase())) continue

      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      const stat = fs.statSync(fullPath)
      if (!stat.isFile() || stat.size === 0) continue

      const ext = path.extname(entry.name).toLowerCase()
      const type = EXTENSIONS.has(ext) ? ext : detectType(fullPath)

      files.push({
        name: entry.name,
        path: path.relative(databasesDir, fullPath).replace(/\\/g, '/'),
        extension: type,
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
