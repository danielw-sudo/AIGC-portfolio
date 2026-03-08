CREATE TABLE models (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  provider   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE entries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  prompt          TEXT,
  negative_prompt TEXT,
  description     TEXT,
  model_id        INTEGER REFERENCES models(id),
  source_url      TEXT,
  image_key       TEXT NOT NULL,
  image_url       TEXT NOT NULL,
  width           INTEGER,
  height          INTEGER,
  file_size       INTEGER,
  mime_type       TEXT DEFAULT 'image/jpeg',
  status          TEXT NOT NULL DEFAULT 'draft',
  featured        INTEGER NOT NULL DEFAULT 0,
  source_type     TEXT DEFAULT 'manual',
  metadata        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE entry_tags (
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entries_model ON entries(model_id);
CREATE INDEX idx_entries_created ON entries(created_at DESC);
CREATE INDEX idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);
