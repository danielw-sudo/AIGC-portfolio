import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { slugify } from '@/lib/core/slugify';
import { generateImageKey, uploadImage, ensureUniqueKey, getPublicUrl } from '@/lib/core/r2';
import { getImageDimensions } from '@/lib/core/image-dimensions';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * POST /api/scrape
 * Fetch an image from an external URL, upload to R2, return key + metadata.
 * Body: { url: string, slug?: string }
 */
export async function POST(context: APIContext) {

  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const body = await context.request.json().catch(() => null) as { url?: string; slug?: string } | null;
  if (!body?.url) {
    return json({ error: 'url is required' }, 400);
  }

  const sourceUrl = body.url;

  // Validate URL format
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    return json({ error: 'Invalid URL — must be http or https' }, 400);
  }

  // Fetch the remote image
  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'aigc-portfolio/1.0' },
      redirect: 'follow',
    });
  } catch (err) {
    return json({ error: `Fetch failed: ${(err as Error).message}` }, 502);
  }

  if (!response.ok) {
    return json({ error: `Remote returned ${response.status}` }, 502);
  }

  // Detect content type
  const contentType = response.headers.get('content-type')?.split(';')[0].trim() || '';
  const mimeType = ALLOWED_TYPES.has(contentType) ? contentType : inferMimeFromUrl(sourceUrl);

  if (!mimeType) {
    return json({ error: `Unsupported image type: ${contentType || 'unknown'}` }, 400);
  }

  // Read bytes
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    return json({ error: 'Empty response body' }, 400);
  }
  if (buffer.byteLength > MAX_SIZE) {
    return json({ error: `Image too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB, max 25MB)` }, 400);
  }

  // Generate slug from hint, URL filename, or timestamp
  const slugHint = body.slug || filenameFromUrl(parsed) || '';
  const slug = slugify(slugHint);

  const baseKey = generateImageKey(slug, mimeType);
  const key = await ensureUniqueKey(env.IMAGES, baseKey);

  await uploadImage(env.IMAGES, key, buffer, mimeType);

  const imageUrl = getPublicUrl(env.R2_PUBLIC_URL, key);

  const dims = getImageDimensions(buffer);

  return json({
    image_key: key,
    image_url: imageUrl,
    mime_type: mimeType,
    file_size: buffer.byteLength,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    source_url: sourceUrl,
  });
}

/** Extract filename (without extension) from URL path */
function filenameFromUrl(url: URL): string {
  const segments = url.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  return last.replace(/\.[^.]+$/, '');
}

/** Infer MIME type from URL extension when Content-Type header is unhelpful */
function inferMimeFromUrl(url: string): string | null {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return null;
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
