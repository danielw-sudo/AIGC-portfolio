import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { EntryService, EntryImageService } from '@/lib/data';
import { deleteImage } from '@/lib/core/r2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function GET(context: APIContext) {
  const entryId = Number(context.params.id);
  if (!entryId) return json({ error: 'Invalid entry ID' }, 400);

  const images = new EntryImageService(env.DB);
  const list = await images.listByEntry(entryId);
  return json(list);
}

export async function POST(context: APIContext) {
  const entryId = Number(context.params.id);
  if (!entryId) return json({ error: 'Invalid entry ID' }, 400);

  const entries = new EntryService(env.DB);
  const entry = await entries.getById(entryId);
  if (!entry) return json({ error: 'Entry not found' }, 404);

  const body = await context.request.json().catch(() => null);
  if (!body?.image_key || !body?.image_url) {
    return json({ error: 'image_key and image_url required' }, 400);
  }

  const images = new EntryImageService(env.DB);
  const row = await images.add(entryId, {
    image_key: body.image_key,
    image_url: body.image_url,
    width: body.width ?? null,
    height: body.height ?? null,
    file_size: body.file_size ?? null,
    mime_type: body.mime_type ?? 'image/jpeg',
  });
  return json(row, 201);
}

export async function DELETE(context: APIContext) {
  const entryId = Number(context.params.id);
  if (!entryId) return json({ error: 'Invalid entry ID' }, 400);

  const imageId = Number(context.url.searchParams.get('image_id'));
  if (!imageId) return json({ error: 'image_id required' }, 400);

  const images = new EntryImageService(env.DB);
  const deleted = await images.remove(imageId);
  if (!deleted) return json({ error: 'Image not found' }, 404);

  // Clean up R2
  if (deleted.image_key) {
    await deleteImage(env.IMAGES, deleted.image_key);
  }

  return json({ ok: true, deleted });
}
