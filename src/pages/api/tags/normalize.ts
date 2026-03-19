import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { TaxonomyService } from '@/lib/data';
import { toTitleCase } from '@/lib/core/slugify';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** POST /api/tags/normalize — Title Case all existing tags. Idempotent. */
export async function POST(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const taxonomy = new TaxonomyService(env.DB);
  const tags = await taxonomy.getAllTags();

  let updated = 0;
  for (const tag of tags) {
    const desired = toTitleCase(tag.title);
    if (desired !== tag.title) {
      await taxonomy.updateTag(tag.id, { title: desired });
      updated++;
    }
  }

  return json({ total: tags.length, updated });
}
