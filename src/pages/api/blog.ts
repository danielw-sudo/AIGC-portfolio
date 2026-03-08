import type { APIContext } from 'astro';
import { BlogPostService } from '@/lib/data/blog';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** GET /api/blog — list published blog posts (paginated) */
export async function GET(context: APIContext) {
  const { env } = context.locals.runtime;
  const url = new URL(context.request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const svc = new BlogPostService(env.DB);
  return json(await svc.listPublished(page));
}

/** POST /api/blog — create a new blog post */
export async function POST(context: APIContext) {
  const { env } = context.locals.runtime;
  const body = await context.request.json().catch(() => null);

  const title = (body?.title as string)?.trim();
  if (!title) return json({ error: 'title is required' }, 400);

  const svc = new BlogPostService(env.DB);
  try {
    const post = await svc.create({
      title,
      slug: body.slug?.trim() || undefined,
      summary: body.summary?.trim() || undefined,
      body: body.body || '',
      image_key: body.image_key || undefined,
      image_url: body.image_url || undefined,
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      file_size: body.file_size ? Number(body.file_size) : undefined,
      mime_type: body.mime_type || undefined,
      status: body.status || 'draft',
      featured: !!body.featured,
      metadata: body.metadata || undefined,
      topic_ids: body.topic_ids || undefined,
    });
    return json(post, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
