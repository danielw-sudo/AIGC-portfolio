import type { BlogTopicRow, BlogTopicWithCount } from '../../core/types';
import { slugify } from '../../core/slugify';

const Q = {
  ALL: 'SELECT * FROM blog_topics ORDER BY title',
  BY_SLUG: 'SELECT * FROM blog_topics WHERE slug = ?1',
  BY_ID: 'SELECT * FROM blog_topics WHERE id = ?1',
  WITH_COUNT: `
    SELECT bt.*, COUNT(bpt.post_id) as post_count
    FROM blog_topics bt
    LEFT JOIN blog_post_topics bpt ON bpt.topic_id = bt.id
    LEFT JOIN blog_posts bp ON bp.id = bpt.post_id AND bp.status = 'published'
    GROUP BY bt.id ORDER BY bt.title`,
  INSERT: `INSERT INTO blog_topics (slug, title) VALUES (?1, ?2) RETURNING *`,
  UPSERT: `
    INSERT INTO blog_topics (slug, title) VALUES (?1, ?2)
    ON CONFLICT(slug) DO UPDATE SET title = excluded.title
    RETURNING *`,
  UPDATE: `UPDATE blog_topics SET title = ?1 WHERE id = ?2 RETURNING *`,
  DELETE_JUNCTIONS: `DELETE FROM blog_post_topics WHERE topic_id = ?1`,
  DELETE: `DELETE FROM blog_topics WHERE id = ?1`,
} as const;

export class BlogTopicService {
  constructor(private db: D1Database) {}

  async getAll(): Promise<BlogTopicRow[]> {
    const { results } = await this.db.prepare(Q.ALL).all<BlogTopicRow>();
    return results;
  }

  async getBySlug(slug: string): Promise<BlogTopicRow | null> {
    return await this.db.prepare(Q.BY_SLUG).bind(slug).first<BlogTopicRow>();
  }

  async getById(id: number): Promise<BlogTopicRow | null> {
    return await this.db.prepare(Q.BY_ID).bind(id).first<BlogTopicRow>();
  }

  async getWithCount(): Promise<BlogTopicWithCount[]> {
    const { results } = await this.db.prepare(Q.WITH_COUNT).all<BlogTopicWithCount>();
    return results;
  }

  async create(title: string): Promise<BlogTopicRow> {
    const slug = slugify(title);
    const row = await this.db.prepare(Q.INSERT).bind(slug, title).first<BlogTopicRow>();
    if (!row) throw new Error(`Failed to create blog topic: ${title}`);
    return row;
  }

  async upsert(slug: string, title: string): Promise<BlogTopicRow> {
    const row = await this.db.prepare(Q.UPSERT).bind(slug, title).first<BlogTopicRow>();
    if (!row) throw new Error(`Failed to upsert blog topic: ${slug}`);
    return row;
  }

  async update(id: number, data: { title?: string }): Promise<BlogTopicRow> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Blog topic not found');
    const row = await this.db
      .prepare(Q.UPDATE)
      .bind(data.title ?? existing.title, id)
      .first<BlogTopicRow>();
    if (!row) throw new Error('Failed to update blog topic');
    return row;
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare(Q.DELETE_JUNCTIONS).bind(id).run();
    await this.db.prepare(Q.DELETE).bind(id).run();
  }
}
