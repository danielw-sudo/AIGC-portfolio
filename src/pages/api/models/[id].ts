import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { TaxonomyService } from '@/lib/data';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function PUT(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:PUT
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const body = await context.request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const taxonomy = new TaxonomyService(env.DB);
  try {
    const model = await taxonomy.updateModel(id, {
      title: body.title?.trim(),
      provider: typeof body.provider === 'string' ? body.provider.trim() : undefined,
    });
    return json(model);
  } catch (e) {
    return json({ error: (e as Error).message }, 404);
  }
}

export async function DELETE(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:DELETE
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const taxonomy = new TaxonomyService(env.DB);
  try {
    await taxonomy.deleteModel(id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
