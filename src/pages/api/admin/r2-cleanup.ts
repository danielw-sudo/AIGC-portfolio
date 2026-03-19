import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** Collect all R2 keys with cursor-based pagination. */
async function listAllKeys(bucket: R2Bucket): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const list = await bucket.list({ cursor, limit: 1000 });
    objects.push(...list.objects);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  return objects;
}

/** Find R2 objects not referenced in D1. */
async function findOrphans(db: D1Database, bucket: R2Bucket) {
  const [r2Objects, entryKeys, imageKeys] = await Promise.all([
    listAllKeys(bucket),
    db.prepare(`SELECT image_key FROM entries WHERE image_key IS NOT NULL`).all<{ image_key: string }>(),
    db.prepare(`SELECT image_key FROM entry_images WHERE image_key IS NOT NULL`).all<{ image_key: string }>(),
  ]);

  const usedKeys = new Set([
    ...(entryKeys.results || []).map((r) => r.image_key),
    ...(imageKeys.results || []).map((r) => r.image_key),
  ]);

  return r2Objects.filter((obj) => !usedKeys.has(obj.key));
}

/** GET — dry run: list orphans. DELETE — remove orphans. */
export async function GET(ctx: APIContext) {
  try {
    const orphans = await findOrphans(env.DB, env.IMAGES);
    const totalSize = orphans.reduce((sum, o) => sum + o.size, 0);
    return json({
      orphans: orphans.map((o) => ({ key: o.key, size: o.size })),
      totalSize,
      count: orphans.length,
      deleted: false,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
}

export async function DELETE(ctx: APIContext) {
  try {
    const orphans = await findOrphans(env.DB, env.IMAGES);
    if (orphans.length === 0) return json({ count: 0, freedBytes: 0, deleted: true });

    // Delete in batches of 100
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100);
      await Promise.all(batch.map((o) => env.IMAGES.delete(o.key)));
    }

    const freedBytes = orphans.reduce((sum, o) => sum + o.size, 0);
    return json({ count: orphans.length, freedBytes, deleted: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
}
