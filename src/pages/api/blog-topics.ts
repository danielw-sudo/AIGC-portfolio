import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { BlogTopicService } from '@/lib/data/blog';
import { slugify } from '@/lib/core/slugify';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** GET /api/blog-topics — list all blog topics with post counts */
export async function GET(context: APIContext) {
  const svc = new BlogTopicService(env.DB);
  return json(await svc.getWithCount());
}

/** POST /api/blog-topics — upsert a blog topic */
export async function POST(context: APIContext) {
  const body = await context.request.json().catch(() => null);

  let title = (body?.title as string)?.trim();
  if (!title) return json({ error: 'title is required' }, 400);

  // Strip HTML tags, cap length
  title = title.replace(/<[^>]*>/g, '').substring(0, 50);
  if (!title) return json({ error: 'title is empty after sanitization' }, 400);

  const slug = slugify(title);
  const svc = new BlogTopicService(env.DB);

  try {
    const topic = await svc.upsert(slug, title);
    return json(topic, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
