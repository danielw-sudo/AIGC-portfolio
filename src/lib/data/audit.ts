/**
 * Site audit — structured health checks across D1 and R2.
 * Returns data, not formatted strings — pages render as they wish.
 */

export interface AuditResult {
  entries: { total: number; published: number; drafts: number; staleDrafts: number };
  blog: { total: number; missingSummary: number };
  seo: { missingDesc: number; untagged: number; unusedTags: number };
  images: { orphanCount: number; orphanSizeKB: number };
}

interface AuditEnv { DB: D1Database; IMAGES: R2Bucket }

export async function runAudit(env: AuditEnv): Promise<AuditResult> {
  const db = env.DB;

  const [eTotal, ePub, bTotal, noDesc, noTags, staleDrafts, unusedTags, blogNoDesc] =
    await Promise.all([
      db.prepare(`SELECT COUNT(*) as c FROM entries`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM entries WHERE status = 'published'`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM blog_posts`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM entries WHERE description IS NULL OR description = ''`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM entries e WHERE NOT EXISTS (SELECT 1 FROM entry_tags et WHERE et.entry_id = e.id)`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM entries WHERE status = 'draft' AND created_at < datetime('now', '-30 days')`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM tags t WHERE NOT EXISTS (SELECT 1 FROM entry_tags et WHERE et.tag_id = t.id)`).first<{ c: number }>(),
      db.prepare(`SELECT COUNT(*) as c FROM blog_posts WHERE summary IS NULL OR summary = ''`).first<{ c: number }>(),
    ]);

  const total = eTotal?.c ?? 0;
  const pub = ePub?.c ?? 0;

  // R2 orphan check
  let orphanCount = 0;
  let orphanSizeKB = 0;
  try {
    const r2Objects = await listAllR2Keys(env.IMAGES);
    const [entryKeys, imageKeys] = await Promise.all([
      db.prepare(`SELECT image_key FROM entries WHERE image_key IS NOT NULL`).all<{ image_key: string }>(),
      db.prepare(`SELECT image_key FROM entry_images WHERE image_key IS NOT NULL`).all<{ image_key: string }>(),
    ]);
    const usedKeys = new Set([
      ...(entryKeys.results || []).map((r) => r.image_key),
      ...(imageKeys.results || []).map((r) => r.image_key),
    ]);
    for (const obj of r2Objects) {
      if (!usedKeys.has(obj.key)) { orphanCount++; orphanSizeKB += obj.size; }
    }
    orphanSizeKB = Math.round(orphanSizeKB / 1024);
  } catch {
    // R2 not available — skip
  }

  return {
    entries: { total, published: pub, drafts: total - pub, staleDrafts: staleDrafts?.c ?? 0 },
    blog: { total: bTotal?.c ?? 0, missingSummary: blogNoDesc?.c ?? 0 },
    seo: { missingDesc: noDesc?.c ?? 0, untagged: noTags?.c ?? 0, unusedTags: unusedTags?.c ?? 0 },
    images: { orphanCount, orphanSizeKB },
  };
}

async function listAllR2Keys(bucket: R2Bucket): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const list = await bucket.list({ cursor, limit: 1000 });
    objects.push(...list.objects);
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  return objects;
}
