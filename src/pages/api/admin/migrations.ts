import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { MigrationService } from '@/lib/data/migrations';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** GET /api/admin/migrations — list migration history */
export async function GET(context: APIContext) {
  const svc = new MigrationService(env.DB);
  return json(await svc.list());
}

/** POST /api/admin/migrations — execute a migration */
export async function POST(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const body = await context.request.json().catch(() => null);

  const name = (body?.name as string)?.trim();
  const sql = (body?.sql as string)?.trim();

  if (!name) return json({ error: 'name is required' }, 400);
  if (!sql) return json({ error: 'sql is required' }, 400);
  if (name.length > 200) return json({ error: 'name too long (max 200)' }, 400);
  if (sql.length > 50_000) return json({ error: 'sql too long (max 50KB)' }, 400);

  const hash = await sha256(sql);
  const svc = new MigrationService(env.DB);

  if (await svc.hashExists(hash)) {
    return json({ error: 'This exact SQL has already been executed' }, 409);
  }

  try {
    const record = await svc.execute(name, sql, hash);
    return json({ ok: true, ...record });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
