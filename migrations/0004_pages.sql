-- Pages collection for static content (about, etc.)
CREATE TABLE pages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pages_slug ON pages(slug);
