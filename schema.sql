
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS chains;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS inspirations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, 
  role TEXT DEFAULT 'user', 
  created_at INTEGER,
  storage_usage INTEGER DEFAULT 0
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chains (
  id TEXT PRIMARY KEY,
  user_id TEXT, 
  username TEXT, 
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  preview_image TEXT,
  base_prompt TEXT DEFAULT '',
  negative_prompt TEXT DEFAULT '',
  modules TEXT DEFAULT '[]',
  params TEXT DEFAULT '{}',
  variable_values TEXT DEFAULT '{}', -- 新增字段
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT
);

CREATE TABLE inspirations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  title TEXT NOT NULL,
  image_url TEXT,
  prompt TEXT,
  created_at INTEGER
);
