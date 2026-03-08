-- Migration tracking table (self-bootstrapping via MigrationService.ensureTable)
CREATE TABLE IF NOT EXISTS _migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  sql_hash    TEXT NOT NULL,
  executed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
