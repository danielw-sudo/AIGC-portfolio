import type { APIContext } from 'astro';
import { TaxonomyService } from '@/lib/data';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function GET(context: APIContext) {
  const { env } = context.locals.runtime;
  const taxonomy = new TaxonomyService(env.DB);
  const models = await taxonomy.getModelsWithCount();
  return json(models);
}

export async function POST(context: APIContext) {
  const { env } = context.locals.runtime;
  const body = await context.request.json().catch(() => null);
  const title = (body?.title as string)?.trim();
  if (!title) return json({ error: 'title is required' }, 400);

  const taxonomy = new TaxonomyService(env.DB);
  try {
    const model = await taxonomy.createModel(title, body?.provider?.trim() || undefined);
    return json(model, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
