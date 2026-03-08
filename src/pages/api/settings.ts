import type { APIContext } from 'astro';
import { SettingsService } from '@/lib/data';

const ALLOWED_KEYS = [
  'ai_model_fast', 'ai_model_balanced', 'ai_model_quality', 'ai_model_vision',
  'ai_recipe', 'ai_blog_recipe', 'ai_vision_recipe', 'ai_blog_copywrite_recipe',
  'site_hero_title', 'site_hero_subtitle', 'site_hero_cta_1', 'site_hero_cta_2',
  'site_header_links', 'site_footer_links',
  'meta_desc_home', 'meta_desc_gallery', 'meta_desc_tags',
  'meta_desc_models', 'meta_desc_blog', 'meta_desc_blog_topics',
];

export async function GET(context: APIContext) {
  const { env } = context.locals.runtime;
  const settings = new SettingsService(env.DB);
  const all = await settings.getAll();

  return new Response(JSON.stringify(all), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(context: APIContext) {
  const { env } = context.locals.runtime;
  const body = await context.request.json().catch(() => null) as Record<string, string> | null;

  if (!body || typeof body !== 'object') {
    return new Response(
      JSON.stringify({ error: 'Invalid body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const settings = new SettingsService(env.DB);

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    if (typeof value !== 'string') continue;
    await settings.set(key, value);
  }

  const updated = await settings.getAll();
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  });
}
