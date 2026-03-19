import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { TaxonomyService } from '@/lib/data';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function PUT(context: APIContext) {
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const body = await context.request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const taxonomy = new TaxonomyService(env.DB);
  try {
    const tag = await taxonomy.updateTag(id, { title: body.title?.trim() });
    return json(tag);
  } catch (e) {
    return json({ error: (e as Error).message }, 404);
  }
}

export async function DELETE(context: APIContext) {
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const taxonomy = new TaxonomyService(env.DB);
  try {
    await taxonomy.deleteTag(id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
