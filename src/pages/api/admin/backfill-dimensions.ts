import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { getImageDimensions } from '@/lib/core/image-dimensions';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * POST /api/admin/backfill-dimensions
 * Reads each entry's image from R2, parses width/height, updates the DB row.
 * One-time migration utility.
 */
export async function POST(context: APIContext) {

  const { results: entries } = await env.DB
    .prepare('SELECT id, image_key FROM entries WHERE width IS NULL AND image_key IS NOT NULL')
    .all<{ id: number; image_key: string }>();

  if (entries.length === 0) return json({ updated: 0, message: 'All entries already have dimensions' });

  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      const obj = await env.IMAGES.get(entry.image_key);
      if (!obj) { errors.push(`${entry.id}: key not found in R2`); continue; }

      const buffer = await obj.arrayBuffer();
      const dims = getImageDimensions(buffer);
      if (!dims) { errors.push(`${entry.id}: could not parse dimensions`); continue; }

      await env.DB
        .prepare('UPDATE entries SET width = ?1, height = ?2 WHERE id = ?3')
        .bind(dims.width, dims.height, entry.id)
        .run();
      updated++;
    } catch (e) {
      errors.push(`${entry.id}: ${(e as Error).message}`);
    }
  }

  return json({ updated, total: entries.length, errors });
}
