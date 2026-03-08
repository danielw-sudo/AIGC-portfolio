/**
 * Image upload + scrape wrappers (client-side).
 * Calls /api/upload and /api/scrape, returns typed result.
 */

export interface UploadResult {
  image_key: string;
  image_url: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
}

/** Upload a File to R2 via /api/upload. */
export async function uploadFile(file: File, slugHint?: string): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('image', file);
  if (slugHint) fd.append('slug', slugHint);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return await res.json();
}

/** Scrape an image URL to R2 via /api/scrape. */
export async function scrapeImage(url: string, slugHint?: string): Promise<UploadResult> {
  const payload: Record<string, string> = { url };
  if (slugHint) payload.slug = slugHint;
  const res = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Scrape failed');
  return await res.json();
}
