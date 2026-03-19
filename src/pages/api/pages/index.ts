import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { PageService } from '@/lib/data';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function GET(context: APIContext) {
  const pages = new PageService(env.DB);
  return json(await pages.listAll());
}

export async function POST(context: APIContext) {
  const body = await context.request.json().catch(() => null);
  const title = (body?.title as string)?.trim();
  if (!title) return json({ error: 'title is required' }, 400);

  const pages = new PageService(env.DB);
  try {
    const page = await pages.create({
      title,
      slug: body?.slug?.trim(),
      content: body?.content ?? '',
      image_key: body?.image_key ?? null,
      image_url: body?.image_url ?? null,
      status: body?.status ?? 'draft',
      tag_ids: Array.isArray(body?.tag_ids) ? body.tag_ids : undefined,
    });
    return json(page, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
