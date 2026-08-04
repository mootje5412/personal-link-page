CREATE TABLE IF NOT EXISTS loop_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_loop_users_username ON loop_users(username);

CREATE TABLE IF NOT EXISTS loop_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  sound_name TEXT NOT NULL DEFAULT 'Original Sound',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES loop_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loop_videos_user_id ON loop_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_loop_videos_created_at ON loop_videos(created_at);

CREATE TABLE IF NOT EXISTS loop_likes (
  user_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, video_id),
  FOREIGN KEY (user_id) REFERENCES loop_users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES loop_videos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loop_follows (
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES loop_users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES loop_users(id) ON DELETE CASCADE
);
