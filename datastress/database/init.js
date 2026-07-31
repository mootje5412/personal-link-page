const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');

const dbDir = path.dirname(path.resolve(config.dbPath));
const dataDir = path.dirname(path.resolve(config.attacksCsvPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.resolve(config.dbPath));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    plan_id INTEGER DEFAULT NULL,
    plan_expires_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    crypto TEXT NOT NULL,
    amount_eur REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT DEFAULT NULL
  );
`);

const attacksCsvPath = path.resolve(config.attacksCsvPath);

if (!fs.existsSync(attacksCsvPath)) {
  fs.writeFileSync(
    attacksCsvPath,
    'timestamp,telegram_id,username,target,port,method,duration,status\n',
    'utf8'
  );
}

module.exports = db;
