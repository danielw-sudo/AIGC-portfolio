import type { APIRoute } from 'astro';
import { BlogPostService } from '@/lib/data/blog';

const SITE = import.meta.env.SITE_URL || 'https://example.com';

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ locals }) => {
  const { env } = (locals as { runtime: { env: { DB: D1Database } } }).runtime;
  const svc = new BlogPostService(env.DB);
  const result = await svc.listPublished(1, 50);

  const items = result.data
    .map(
      (post) => `    <item>
      <title>${escXml(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <description>${escXml(post.summary || '')}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog</title>
    <link>${SITE}/blog</link>
    <description>Thoughts on AI art, tools, and creative process.</description>
    <language>en</language>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
