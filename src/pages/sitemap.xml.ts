import type { APIRoute } from 'astro';
import { EntryService, TaxonomyService } from '@/lib/data';
import { BlogPostService, BlogTopicService } from '@/lib/data/blog';

const SITE = import.meta.env.SITE_URL || 'https://example.com';

export const GET: APIRoute = async ({ locals }) => {
  const { env } = (locals as { runtime: { env: { DB: D1Database } } }).runtime;
  const entries = new EntryService(env.DB);
  const taxonomy = new TaxonomyService(env.DB);
  const blogSvc = new BlogPostService(env.DB);
  const blogTopicSvc = new BlogTopicService(env.DB);

  const [published, models, tags, blogPosts, blogTopics] = await Promise.all([
    entries.listPublished(1, 1000),
    taxonomy.getModelsWithCount(),
    taxonomy.getTagsWithCount(),
    blogSvc.listPublished(1, 1000),
    blogTopicSvc.getWithCount(),
  ]);

  const urls: { loc: string; priority: string; changefreq: string }[] = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/blog', priority: '0.8', changefreq: 'daily' },
    { loc: '/blog/topics', priority: '0.6', changefreq: 'weekly' },
    { loc: '/models', priority: '0.7', changefreq: 'weekly' },
    { loc: '/tags', priority: '0.7', changefreq: 'weekly' },
  ];

  for (const entry of published.data) {
    urls.push({ loc: `/${entry.slug}`, priority: '0.8', changefreq: 'monthly' });
  }
  for (const model of models) {
    urls.push({ loc: `/models/${model.slug}`, priority: '0.6', changefreq: 'weekly' });
  }
  for (const tag of tags) {
    urls.push({ loc: `/tags/${tag.slug}`, priority: '0.5', changefreq: 'weekly' });
  }
  for (const post of blogPosts.data) {
    urls.push({ loc: `/blog/${post.slug}`, priority: '0.7', changefreq: 'weekly' });
  }
  for (const topic of blogTopics) {
    urls.push({ loc: `/blog/topics/${topic.slug}`, priority: '0.5', changefreq: 'weekly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
