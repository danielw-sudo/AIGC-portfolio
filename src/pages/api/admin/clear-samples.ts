import type { APIContext } from 'astro';
import { deleteImage } from '@/lib/core/r2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const SAMPLE_R2_KEYS = ['samples/sample-1.svg', 'samples/sample-2.svg', 'samples/sample-3.svg'];

export async function POST(ctx: APIContext) {
  const { env } = ctx.locals.runtime;

  try {
    // Delete sample entries (entry_tags cascade automatically)
    const entryResult = await env.DB.prepare(
      `DELETE FROM entries WHERE source_type = 'sample'`,
    ).run();

    // Delete welcome blog post (blog_post_topics cascade automatically)
    const postResult = await env.DB.prepare(
      `DELETE FROM blog_posts WHERE slug = 'welcome-to-your-gallery'`,
    ).run();

    // Delete R2 objects (ignore errors for missing keys)
    let r2Deleted = 0;
    for (const key of SAMPLE_R2_KEYS) {
      try {
        await deleteImage(env.IMAGES, key);
        r2Deleted++;
      } catch {
        // Key may not exist — safe to ignore
      }
    }

    return json({
      deleted: {
        entries: entryResult.meta.changes ?? 0,
        posts: postResult.meta.changes ?? 0,
        r2Objects: r2Deleted,
      },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
}
