CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  terms_accepted_at TEXT NOT NULL,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_api_key_prefix ON users(api_key_prefix);

CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  search_type TEXT NOT NULL,
  query_preview TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);
