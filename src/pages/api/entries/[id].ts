import type { APIContext } from 'astro';
import { EntryService, EntryImageService } from '@/lib/data';
import { deleteImage } from '@/lib/core/r2';

export async function PUT(context: APIContext) {
  const { env } = context.locals.runtime;

  const id = Number(context.params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await context.request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entries = new EntryService(env.DB);
  try {
    // Clean up old cover image from R2 if being replaced or removed
    if ('image_key' in body) {
      const existing = await entries.getById(id);
      if (existing?.image_key && existing.image_key !== body.image_key) {
        await deleteImage(env.IMAGES, existing.image_key);
      }
    }

    const entry = await entries.update(id, body);
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(context: APIContext) {
  const { env } = context.locals.runtime;

  const id = Number(context.params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entries = new EntryService(env.DB);
  const existing = await entries.getById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete all additional images from R2
  const images = new EntryImageService(env.DB);
  const imageKeys = await images.removeAllByEntry(id);
  for (const key of imageKeys) {
    await deleteImage(env.IMAGES, key);
  }

  // Delete cover image from R2
  if (existing.image_key) {
    await deleteImage(env.IMAGES, existing.image_key);
  }

  await entries.delete(id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
