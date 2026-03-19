import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { slugify } from '@/lib/core/slugify';
import { EntryService, TaxonomyService } from '@/lib/data';
import { generateImageKey, uploadImage, ensureUniqueKey, getPublicUrl } from '@/lib/core/r2';

/** Shape of ai-image-catalog entries.json items */
interface CatalogEntry {
  slug: string;
  title: string;
  imageUrl: string;
  platform: string;
  date: string;
  tags: string;
  prompt: string;
}

/** Platform name → model slug mapping */
const PLATFORM_MAP: Record<string, string> = {
  'grok': 'grok',
  'meta ai': 'meta-ai',
  'gemini': 'gemini',
  'midjourney': 'midjourney',
  'comfyui': 'comfyui',
  'stable diffusion': 'stable-diffusion',
  'dall-e': 'dall-e',
  'flux': 'flux',
};

/**
 * POST /api/import
 * Batch import entries from ai-image-catalog format.
 * Body: { entries: CatalogEntry[], skip_images?: boolean }
 */
export async function POST(context: APIContext) {

  const body = await context.request.json().catch(() => null) as {
    entries?: CatalogEntry[];
    skip_images?: boolean;
  } | null;
  if (!body?.entries || !Array.isArray(body.entries)) {
    return json({ error: 'entries array is required' }, 400);
  }

  const items = body.entries;
  const skipImages = body.skip_images === true;

  const taxonomy = new TaxonomyService(env.DB);
  const entries = new EntryService(env.DB);

  // Pre-load models for platform lookup
  const models = await taxonomy.getAllModels();
  const modelBySlug = new Map(models.map((m) => [m.slug, m]));

  const results: ImportResult[] = [];

  for (const item of items) {
    const result = await importOne(
      item, env, taxonomy, entries, modelBySlug, skipImages,
    );
    results.push(result);
  }

  const imported = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  return json({ imported, failed, skipped, results });
}

interface ImportResult {
  slug: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
}

async function importOne(
  item: CatalogEntry,
  env: Env,
  taxonomy: TaxonomyService,
  entries: EntryService,
  modelBySlug: Map<string, { id: number; slug: string }>,
  skipImages: boolean,
): Promise<ImportResult> {
  const slug = item.slug || slugify(item.title);

  try {
    // Check if already exists
    const existing = await entries.getBySlug(slug);
    if (existing) return { slug, status: 'skipped' };

    // Resolve model from platform name
    const platformKey = item.platform.toLowerCase();
    const modelSlug = PLATFORM_MAP[platformKey];
    const model = modelSlug ? modelBySlug.get(modelSlug) : undefined;

    // Parse comma-separated tags → upsert each
    const tagIds: number[] = [];
    if (item.tags) {
      const tagNames = item.tags.split(',').map((t) => t.trim()).filter(Boolean);
      for (const name of tagNames) {
        const tagSlug = slugify(name);
        const tag = await taxonomy.upsertTag(tagSlug, name);
        tagIds.push(tag.id);
      }
    }

    // Fetch + upload image (or skip)
    let imageKey = '';
    let imageUrl = '';
    let mimeType = 'image/jpeg';
    let fileSize = 0;

    if (!skipImages && item.imageUrl) {
      const fetched = await fetchAndUpload(item.imageUrl, slug, env);
      imageKey = fetched.key;
      imageUrl = fetched.url;
      mimeType = fetched.mime;
      fileSize = fetched.size;
    } else {
      // Store original URL directly (images may expire)
      imageUrl = item.imageUrl;
      imageKey = '';
    }

    await entries.create({
      title: item.title,
      slug,
      prompt: item.prompt || undefined,
      model_id: model?.id,
      image_key: imageKey,
      image_url: imageUrl,
      mime_type: mimeType,
      file_size: fileSize || undefined,
      source_url: item.imageUrl,
      status: 'published',
      featured: false,
      tag_ids: tagIds.length > 0 ? tagIds : undefined,
    });

    return { slug, status: 'ok' };
  } catch (err) {
    return { slug, status: 'error', error: (err as Error).message };
  }
}

async function fetchAndUpload(
  sourceUrl: string,
  slug: string,
  env: Env,
): Promise<{ key: string; url: string; mime: string; size: number }> {
  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'aigc-portfolio/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Fetch ${res.status}`);

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error('Empty image');

  const ct = res.headers.get('content-type')?.split(';')[0].trim() || '';
  const mime = inferMime(ct, sourceUrl);

  const baseKey = generateImageKey(slug, mime);
  const key = await ensureUniqueKey(env.IMAGES, baseKey);
  await uploadImage(env.IMAGES, key, buffer, mime);

  return {
    key,
    url: getPublicUrl(env.R2_PUBLIC_URL, key),
    mime,
    size: buffer.byteLength,
  };
}

function inferMime(contentType: string, url: string): string {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (ALLOWED.includes(contentType)) return contentType;
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg'; // default
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
