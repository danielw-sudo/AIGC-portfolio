import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { BlogPostService } from '@/lib/data/blog';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** PUT /api/blog/:id — update a blog post */
export async function PUT(context: APIContext) {
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid id' }, 400);

  const body = await context.request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const svc = new BlogPostService(env.DB);
  const existing = await svc.getById(id);
  if (!existing) return json({ error: 'Post not found' }, 404);

  // R2 cleanup: if cover image changed, delete old one
  const oldKey = existing.image_key;
  const newKey = body.image_key ?? existing.image_key;
  let shouldDeleteOldCover = false;
  if (oldKey && newKey !== oldKey) shouldDeleteOldCover = true;
  if (body.image_key === null && oldKey) shouldDeleteOldCover = true;

  try {
    const post = await svc.update(id, {
      title: body.title?.trim() || undefined,
      summary: body.summary !== undefined ? (body.summary?.trim() || undefined) : undefined,
      body: body.body !== undefined ? body.body : undefined,
      image_key: body.image_key !== undefined ? body.image_key : undefined,
      image_url: body.image_url !== undefined ? body.image_url : undefined,
      width: body.width !== undefined ? Number(body.width) || undefined : undefined,
      height: body.height !== undefined ? Number(body.height) || undefined : undefined,
      file_size: body.file_size !== undefined ? Number(body.file_size) || undefined : undefined,
      mime_type: body.mime_type || undefined,
      status: body.status || undefined,
      featured: body.featured !== undefined ? !!body.featured : undefined,
      metadata: body.metadata || undefined,
      topic_ids: body.topic_ids,
    });

    if (shouldDeleteOldCover && env.IMAGES) {
      await env.IMAGES.delete(oldKey!).catch(() => {});
    }

    return json(post);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

/** DELETE /api/blog/:id — delete a blog post */
export async function DELETE(context: APIContext) {
  const id = Number(context.params.id);
  if (!id) return json({ error: 'Invalid id' }, 400);

  const svc = new BlogPostService(env.DB);
  const existing = await svc.getById(id);
  if (!existing) return json({ error: 'Post not found' }, 404);

  // R2 cleanup: delete cover image if exists
  if (existing.image_key && env.IMAGES) {
    await env.IMAGES.delete(existing.image_key).catch(() => {});
  }

  await svc.delete(id);
  return json({ ok: true });
}
