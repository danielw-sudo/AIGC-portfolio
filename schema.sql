-- AIGC Portfolio — Complete D1 Schema
-- Canonical DDL for fresh deploys.
-- Run: wrangler d1 execute your-db-name --file=schema.sql
-- For incremental changes, use the admin migration runner.

-- === Taxonomy ===

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

-- === Gallery (entries) ===

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
  mime_type        TEXT DEFAULT 'image/jpeg',
  status          TEXT NOT NULL DEFAULT 'draft',
  featured        INTEGER NOT NULL DEFAULT 0,
  source_type     TEXT DEFAULT 'manual',
  metadata        TEXT,
  prompt_params   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE entry_tags (
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE entry_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id   INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  image_key  TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  file_size  INTEGER,
  mime_type   TEXT DEFAULT 'image/jpeg',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- === Pages ===

CREATE TABLE pages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  image_key  TEXT,
  image_url  TEXT,
  status     TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE page_tags (
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);

-- === Settings ===

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- === Blog ===

CREATE TABLE blog_topics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE blog_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  summary    TEXT,
  body       TEXT NOT NULL DEFAULT '',
  image_key  TEXT,
  image_url  TEXT,
  width      INTEGER,
  height     INTEGER,
  file_size  INTEGER,
  mime_type  TEXT DEFAULT 'image/jpeg',
  status     TEXT NOT NULL DEFAULT 'draft',
  featured   INTEGER NOT NULL DEFAULT 0,
  metadata   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE blog_post_topics (
  post_id  INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES blog_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, topic_id)
);

-- === Migrations ===

CREATE TABLE _migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  sql_hash    TEXT NOT NULL,
  executed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- === Indexes ===

CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entries_model ON entries(model_id);
CREATE INDEX idx_entries_created ON entries(created_at DESC);
CREATE INDEX idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);
CREATE INDEX idx_entry_images_entry ON entry_images(entry_id, sort_order);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_page_tags_page ON page_tags(page_id);
CREATE INDEX idx_page_tags_tag ON page_tags(tag_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_post_topics_post ON blog_post_topics(post_id);
CREATE INDEX idx_blog_post_topics_topic ON blog_post_topics(topic_id);
