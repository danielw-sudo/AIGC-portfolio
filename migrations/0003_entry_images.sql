-- Multi-image support: stores all images per entry (including cover at sort_order=0)
CREATE TABLE entry_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id   INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  image_key  TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  file_size  INTEGER,
  mime_type  TEXT DEFAULT 'image/jpeg',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_entry_images_entry ON entry_images(entry_id, sort_order);
