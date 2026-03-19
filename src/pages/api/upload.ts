import { env } from "cloudflare:workers";
import { isDemoMode, demoBlock } from '@/lib/core/demo';
import type { APIContext } from 'astro';
import { slugify } from '@/lib/core/slugify';
import { generateImageKey, uploadImage, ensureUniqueKey, getPublicUrl } from '@/lib/core/r2';
import { getImageDimensions } from '@/lib/core/image-dimensions';

export async function POST(context: APIContext) {

  if (isDemoMode()) return demoBlock(); // demo-guard:POST
  const formData = await context.request.formData();
  const file = formData.get('image') as File | null;
  const slugHint = formData.get('slug')?.toString() || '';

  if (!file || !file.size) {
    return new Response(JSON.stringify({ error: 'No image provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = slugHint ? slugify(slugHint) : slugify(file.name.replace(/\.[^.]+$/, ''));
  const mimeType = file.type || 'image/jpeg';
  const baseKey = generateImageKey(slug, mimeType);
  const key = await ensureUniqueKey(env.IMAGES, baseKey);

  const buffer = await file.arrayBuffer();
  await uploadImage(env.IMAGES, key, buffer, mimeType);

  const imageUrl = getPublicUrl(env.R2_PUBLIC_URL, key);
  const dims = getImageDimensions(buffer);

  return new Response(
    JSON.stringify({
      image_key: key,
      image_url: imageUrl,
      mime_type: mimeType,
      file_size: buffer.byteLength,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
