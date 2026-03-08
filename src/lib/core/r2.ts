const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export function generateImageKey(slug: string, mimeType: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = MIME_TO_EXT[mimeType] || 'jpg';
  return `images/${yyyy}/${mm}/${slug}.${ext}`;
}

export async function uploadImage(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  await bucket.put(key, data, {
    httpMetadata: { contentType: mimeType },
  });
}

export async function deleteImage(
  bucket: R2Bucket,
  key: string,
): Promise<void> {
  await bucket.delete(key);
}

export function getPublicUrl(r2PublicUrl: string, key: string): string {
  return `${r2PublicUrl.replace(/\/$/, '')}/${key}`;
}

export async function ensureUniqueKey(
  bucket: R2Bucket,
  baseKey: string,
): Promise<string> {
  const head = await bucket.head(baseKey);
  if (!head) return baseKey;

  const dotIdx = baseKey.lastIndexOf('.');
  const stem = dotIdx > -1 ? baseKey.substring(0, dotIdx) : baseKey;
  const ext = dotIdx > -1 ? baseKey.substring(dotIdx) : '';
  let counter = 2;
  let candidate: string;
  do {
    candidate = `${stem}-${counter}${ext}`;
    counter++;
  } while (await bucket.head(candidate));
  return candidate;
}
