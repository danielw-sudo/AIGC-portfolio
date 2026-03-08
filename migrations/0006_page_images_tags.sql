-- Add image fields to pages
ALTER TABLE pages ADD COLUMN image_key TEXT;
ALTER TABLE pages ADD COLUMN image_url TEXT;

-- Page-tag many-to-many
CREATE TABLE page_tags (
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
CREATE INDEX idx_page_tags_page ON page_tags(page_id);
CREATE INDEX idx_page_tags_tag ON page_tags(tag_id);
