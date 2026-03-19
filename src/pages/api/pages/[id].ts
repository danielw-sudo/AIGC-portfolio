import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { PageService } from '@/lib/data';
import { deleteImage } from '@/lib/core/r2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function PUT(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:PUT
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const body = await context.request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const pages = new PageService(env.DB);
  try {
    const page = await pages.update(id, {
      title: body.title?.trim(),
      content: body.content,
      image_key: body.image_key !== undefined ? (body.image_key || null) : undefined,
      image_url: body.image_url !== undefined ? (body.image_url || null) : undefined,
      status: body.status,
      tag_ids: Array.isArray(body.tag_ids) ? body.tag_ids : undefined,
    });
    return json(page);
  } catch (e) {
    return json({ error: (e as Error).message }, 404);
  }
}

export async function DELETE(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:DELETE
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid ID' }, 400);

  const pages = new PageService(env.DB);
  try {
    const page = await pages.getById(id);
    if (page?.image_key) {
      await deleteImage(env.IMAGES, page.image_key).catch(() => {});
    }
    await pages.delete(id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
