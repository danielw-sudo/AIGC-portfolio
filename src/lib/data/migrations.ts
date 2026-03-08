export interface MigrationRow {
  id: number;
  name: string;
  sql_hash: string;
  executed_at: string;
}

const Q = {
  ENSURE: `CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sql_hash TEXT NOT NULL, executed_at TEXT NOT NULL DEFAULT (datetime('now')));`,
  LIST: `SELECT * FROM _migrations ORDER BY executed_at DESC`,
  CHECK_HASH: `SELECT COUNT(*) as count FROM _migrations WHERE sql_hash = ?1`,
  INSERT: `INSERT INTO _migrations (name, sql_hash) VALUES (?1, ?2) RETURNING *`,
} as const;

export class MigrationService {
  constructor(private db: D1Database) {}

  /** Ensure _migrations table exists (idempotent). */
  async ensureTable(): Promise<void> {
    await this.db.exec(Q.ENSURE);
  }

  /** List all migration records, newest first. */
  async list(): Promise<MigrationRow[]> {
    await this.ensureTable();
    const { results } = await this.db.prepare(Q.LIST).all<MigrationRow>();
    return results;
  }

  /** Check whether a SQL hash has already been executed. */
  async hashExists(hash: string): Promise<boolean> {
    await this.ensureTable();
    const row = await this.db.prepare(Q.CHECK_HASH).bind(hash).first<{ count: number }>();
    return (row?.count ?? 0) > 0;
  }

  /** Execute SQL migration and record it. */
  async execute(name: string, sql: string, hash: string): Promise<MigrationRow> {
    await this.ensureTable();
    await this.db.exec(sql);
    const row = await this.db.prepare(Q.INSERT).bind(name, hash).first<MigrationRow>();
    if (!row) throw new Error('Failed to record migration');
    return row;
  }
}
