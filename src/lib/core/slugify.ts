export function slugify(input: string): string {
  let slug = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_.\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length > 80) {
    slug = slug.substring(0, 80).replace(/-[^-]*$/, '') || slug.substring(0, 80);
  }

  return slug || `image-${Date.now()}`;
}

/** Title Case: "hello world" → "Hello World", "UPPER" → "Upper". */
export function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
}
