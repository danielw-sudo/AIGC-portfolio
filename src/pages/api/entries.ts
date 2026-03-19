import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { EntryService } from '@/lib/data';
import type { CreateEntryInput } from '@/lib/core/types';

export async function GET(context: APIContext) {
  const url = context.url;
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = Math.min(Number(url.searchParams.get('per_page')) || 24, 100);

  const entries = new EntryService(env.DB);
  const result = await entries.listPublished(page, perPage);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(context: APIContext) {

  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const body = await context.request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.title || !body?.image_key || !body?.image_url) {
    return new Response(
      JSON.stringify({ error: 'title, image_key, and image_url are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const entries = new EntryService(env.DB);
  const entry = await entries.create(body as unknown as CreateEntryInput);

  return new Response(JSON.stringify(entry), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
