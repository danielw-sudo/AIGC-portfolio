/**
 * AI Usage tracking — logs model calls and provides 24h aggregates.
 * Table auto-creates on first write (no migration needed).
 */

export interface UsageLogEntry {
  model: string;
  provider: string;
  action: string;
  status: 'ok' | 'error';
  latency_ms: number;
  created_at: string;
}

export interface UsageStats {
  model: string;
  provider: string;
  total: number;
  errors: number;
  avg_latency_ms: number;
}

const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS ai_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'cf',
    action TEXT NOT NULL DEFAULT 'text',
    status TEXT NOT NULL DEFAULT 'ok',
    latency_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

const INSERT = `INSERT INTO ai_usage_log (model, provider, action, status, latency_ms) VALUES (?1, ?2, ?3, ?4, ?5)`;

const STATS_24H = `
  SELECT model, provider,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
    CAST(AVG(latency_ms) AS INTEGER) as avg_latency_ms
  FROM ai_usage_log
  WHERE created_at > datetime('now', '-24 hours')
  GROUP BY model, provider
  ORDER BY total DESC
`;

const TOTAL_24H = `
  SELECT COUNT(*) as total FROM ai_usage_log
  WHERE created_at > datetime('now', '-24 hours')
`;

const CLEANUP_OLD = `
  DELETE FROM ai_usage_log WHERE created_at < datetime('now', '-7 days')
`;

export class AIUsageService {
  private ready = false;

  constructor(private db: D1Database) {}

  private async ensureTable(): Promise<void> {
    if (this.ready) return;
    try {
      await this.db.exec(ENSURE_TABLE.replace(/\n/g, ' '));
      this.ready = true;
    } catch {
      // Table may already exist — ignore
      this.ready = true;
    }
  }

  /** Log an AI call. Fire-and-forget — never throws. */
  async log(model: string, provider: string, action: string, status: 'ok' | 'error', latencyMs: number): Promise<void> {
    try {
      await this.ensureTable();
      await this.db.prepare(INSERT).bind(model, provider, action, status, Math.round(latencyMs)).run();
    } catch {
      // Non-fatal — never block the main request
    }
  }

  /** Get per-model stats for the last 24 hours. */
  async getStats24h(): Promise<UsageStats[]> {
    try {
      await this.ensureTable();
      const { results } = await this.db.prepare(STATS_24H).all();
      return (results || []) as UsageStats[];
    } catch {
      return [];
    }
  }

  /** Get total request count for the last 24 hours. */
  async getTotal24h(): Promise<number> {
    try {
      await this.ensureTable();
      const row = await this.db.prepare(TOTAL_24H).first<{ total: number }>();
      return row?.total ?? 0;
    } catch {
      return 0;
    }
  }

  /** Delete logs older than 7 days. */
  async cleanup(): Promise<void> {
    try {
      await this.ensureTable();
      await this.db.exec(CLEANUP_OLD.replace(/\n/g, ' '));
    } catch {
      // Non-fatal
    }
  }
}
