const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Format "2026-03-02" or "2026-03-02 12:34:56" → "Mar 2, 2026". */
export function formatDate(raw: string): string {
  const iso = raw.split(/[T ]/)[0];
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
