import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { BlogTopicService } from '@/lib/data/blog';
import { toTitleCase } from '@/lib/core/slugify';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** POST /api/blog-topics/normalize — Title Case all existing blog topics. Idempotent. */
export async function POST(context: APIContext) {
  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const svc = new BlogTopicService(env.DB);
  const topics = await svc.getAll();

  let updated = 0;
  for (const topic of topics) {
    const desired = toTitleCase(topic.title);
    if (desired !== topic.title) {
      await svc.update(topic.id, { title: desired });
      updated++;
    }
  }

  return json({ total: topics.length, updated });
}
