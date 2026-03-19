import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { TaxonomyService } from '@/lib/data';
import { slugify } from '@/lib/core/slugify';

export async function GET(context: APIContext) {
  const taxonomy = new TaxonomyService(env.DB);
  const tags = await taxonomy.getTagsWithCount();

  return new Response(JSON.stringify(tags), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(context: APIContext) {

  const body = await context.request.json().catch(() => null) as Record<string, unknown> | null;
  const INVALID_NAMES = new Set(['none', 'null', 'n/a', 'na', 'undefined', 'nothing', '-']);
  const raw = (body?.title as string)?.trim();
  const title = raw?.replace(/<[^>]*>/g, '').trim().substring(0, 50);
  if (!title || INVALID_NAMES.has(title.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: !title ? 'title is required' : 'Invalid tag name' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const slug = slugify(title);
  const taxonomy = new TaxonomyService(env.DB);
  const tag = await taxonomy.upsertTag(slug, title);

  return new Response(JSON.stringify(tag), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
