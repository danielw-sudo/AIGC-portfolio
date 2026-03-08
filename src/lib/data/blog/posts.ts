import type {
  BlogPostRow, BlogPost, BlogTopicRow, PaginatedResponse,
  CreateBlogPostInput, UpdateBlogPostInput,
} from '../../core/types';
import { slugify } from '../../core/slugify';

const PER_PAGE = 12;

const Q = {
  LIST_PUB: `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`,
  COUNT_PUB: `SELECT COUNT(*) as total FROM blog_posts WHERE status = 'published'`,
  LIST_TOPIC: `SELECT bp.* FROM blog_posts bp JOIN blog_post_topics bpt ON bpt.post_id = bp.id WHERE bp.status = 'published' AND bpt.topic_id = ?1 ORDER BY bp.created_at DESC LIMIT ?2 OFFSET ?3`,
  COUNT_TOPIC: `SELECT COUNT(*) as total FROM blog_posts bp JOIN blog_post_topics bpt ON bpt.post_id = bp.id WHERE bp.status = 'published' AND bpt.topic_id = ?1`,
  SEARCH: `SELECT * FROM blog_posts WHERE status = 'published' AND (title LIKE ?1 OR body LIKE ?1) ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`,
  COUNT_SEARCH: `SELECT COUNT(*) as total FROM blog_posts WHERE status = 'published' AND (title LIKE ?1 OR body LIKE ?1)`,
  FEATURED: `SELECT * FROM blog_posts WHERE status = 'published' AND featured = 1 ORDER BY created_at DESC LIMIT ?1`,
  LATEST: `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ?1`,
  BY_SLUG: `SELECT * FROM blog_posts WHERE slug = ?1`,
  BY_ID: `SELECT * FROM blog_posts WHERE id = ?1`,
  INSERT: `INSERT INTO blog_posts (slug,title,summary,body,image_key,image_url,width,height,file_size,mime_type,status,featured,metadata) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13) RETURNING *`,
  UPDATE: `UPDATE blog_posts SET title=?1,summary=?2,body=?3,image_key=?4,image_url=?5,width=?6,height=?7,file_size=?8,mime_type=?9,status=?10,featured=?11,metadata=?12,updated_at=datetime('now') WHERE id=?13 RETURNING *`,
  DELETE: `DELETE FROM blog_posts WHERE id = ?1`,
  CLEAR_TOPICS: `DELETE FROM blog_post_topics WHERE post_id = ?1`,
  ADD_TOPIC: `INSERT INTO blog_post_topics (post_id, topic_id) VALUES (?1, ?2)`,
  SLUG_EXISTS: `SELECT COUNT(*) as count FROM blog_posts WHERE slug = ?1`,
  TOPICS_FOR: `SELECT bt.* FROM blog_topics bt JOIN blog_post_topics bpt ON bpt.topic_id = bt.id WHERE bpt.post_id = ?1 ORDER BY bt.title`,
} as const;

function paginate<T>(data: T[], total: number, page: number, perPage: number): PaginatedResponse<T> {
  return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
}

export class BlogPostService {
  constructor(private db: D1Database) {}

  async listPublished(page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<BlogPost>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, c] = await Promise.all([
      this.db.prepare(Q.LIST_PUB).bind(perPage, offset).all(),
      this.db.prepare(Q.COUNT_PUB).first<{ total: number }>(),
    ]);
    return paginate(await this.hydrateRows(results as BlogPostRow[]), c?.total ?? 0, page, perPage);
  }

  async listByTopic(topicId: number, page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<BlogPost>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, c] = await Promise.all([
      this.db.prepare(Q.LIST_TOPIC).bind(topicId, perPage, offset).all(),
      this.db.prepare(Q.COUNT_TOPIC).bind(topicId).first<{ total: number }>(),
    ]);
    return paginate(await this.hydrateRows(results as BlogPostRow[]), c?.total ?? 0, page, perPage);
  }

  async search(query: string, page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<BlogPost>> {
    page = Math.max(1, page);
    const like = `%${query}%`;
    const offset = (page - 1) * perPage;
    const [{ results }, c] = await Promise.all([
      this.db.prepare(Q.SEARCH).bind(like, perPage, offset).all(),
      this.db.prepare(Q.COUNT_SEARCH).bind(like).first<{ total: number }>(),
    ]);
    return paginate(await this.hydrateRows(results as BlogPostRow[]), c?.total ?? 0, page, perPage);
  }

  async listFeatured(limit = 3): Promise<BlogPost[]> {
    const { results } = await this.db.prepare(Q.FEATURED).bind(limit).all();
    return this.hydrateRows(results as BlogPostRow[]);
  }

  /** Latest published posts — simple, no pagination. */
  async listLatest(limit = 5): Promise<BlogPost[]> {
    const { results } = await this.db.prepare(Q.LATEST).bind(limit).all();
    return this.hydrateRows(results as BlogPostRow[]);
  }

  async listAllFiltered(opts: {
    page?: number; perPage?: number; q?: string; status?: string; sort?: string;
  } = {}): Promise<PaginatedResponse<BlogPost>> {
    const page = Math.max(1, opts.page ?? 1);
    const perPage = opts.perPage ?? PER_PAGE;
    const offset = (page - 1) * perPage;
    const wheres: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;
    if (opts.q) { wheres.push(`(title LIKE ?${idx} OR body LIKE ?${idx})`); params.push(`%${opts.q}%`); idx++; }
    if (opts.status === 'draft' || opts.status === 'published') { wheres.push(`status = ?${idx}`); params.push(opts.status); idx++; }
    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
    const orderMap: Record<string, string> = { newest: 'created_at DESC', oldest: 'created_at ASC', title: 'title ASC', updated: 'updated_at DESC' };
    const order = orderMap[opts.sort ?? ''] ?? 'created_at DESC';
    const [{ results }, c] = await Promise.all([
      this.db.prepare(`SELECT * FROM blog_posts ${where} ORDER BY ${order} LIMIT ?${idx} OFFSET ?${idx + 1}`).bind(...params, perPage, offset).all(),
      this.db.prepare(`SELECT COUNT(*) as total FROM blog_posts ${where}`).bind(...params).first<{ total: number }>(),
    ]);
    return paginate(await this.hydrateRows(results as BlogPostRow[]), c?.total ?? 0, page, perPage);
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const row = await this.db.prepare(Q.BY_SLUG).bind(slug).first<BlogPostRow>();
    return row ? this.hydrateRow(row) : null;
  }

  async getById(id: number): Promise<BlogPostRow | null> {
    return this.db.prepare(Q.BY_ID).bind(id).first<BlogPostRow>();
  }

  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    const slug = input.slug || (await this.uniqueSlug(slugify(input.title)));
    const row = await this.db.prepare(Q.INSERT).bind(
      slug, input.title, input.summary ?? null, input.body ?? '',
      input.image_key ?? null, input.image_url ?? null,
      input.width ?? null, input.height ?? null, input.file_size ?? null,
      input.mime_type ?? 'image/jpeg', input.status ?? 'draft',
      input.featured ? 1 : 0, input.metadata ? JSON.stringify(input.metadata) : null,
    ).first<BlogPostRow>();
    if (!row) throw new Error('Failed to create blog post');
    if (input.topic_ids?.length) await this.syncTopics(row.id, input.topic_ids);
    return this.hydrateRow(row);
  }

  async update(id: number, input: UpdateBlogPostInput): Promise<BlogPost> {
    const e = await this.getById(id);
    if (!e) throw new Error(`Blog post ${id} not found`);
    const row = await this.db.prepare(Q.UPDATE).bind(
      input.title ?? e.title,
      input.summary !== undefined ? (input.summary ?? null) : e.summary,
      input.body ?? e.body,
      input.image_key !== undefined ? (input.image_key ?? null) : e.image_key,
      input.image_url !== undefined ? (input.image_url ?? null) : e.image_url,
      input.width ?? e.width, input.height ?? e.height,
      input.file_size ?? e.file_size, input.mime_type ?? e.mime_type,
      input.status ?? e.status,
      input.featured !== undefined ? (input.featured ? 1 : 0) : e.featured,
      input.metadata ? JSON.stringify(input.metadata) : e.metadata, id,
    ).first<BlogPostRow>();
    if (!row) throw new Error(`Failed to update blog post ${id}`);
    if (input.topic_ids !== undefined) await this.syncTopics(id, input.topic_ids);
    return this.hydrateRow(row);
  }

  async delete(id: number): Promise<boolean> {
    return (await this.db.prepare(Q.DELETE).bind(id).run()).meta.changes > 0;
  }

  async syncTopics(postId: number, topicIds: number[]): Promise<void> {
    await this.db.prepare(Q.CLEAR_TOPICS).bind(postId).run();
    for (const tid of topicIds) await this.db.prepare(Q.ADD_TOPIC).bind(postId, tid).run();
  }

  private async hydrateRows(rows: BlogPostRow[]): Promise<BlogPost[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const { results: tr } = await this.db
      .prepare(`SELECT bpt.post_id, bt.* FROM blog_post_topics bpt JOIN blog_topics bt ON bt.id = bpt.topic_id WHERE bpt.post_id IN (${ids.map(() => '?').join(',')}) ORDER BY bt.title`)
      .bind(...ids).all<BlogTopicRow & { post_id: number }>();
    const tm = new Map<number, BlogTopicRow[]>();
    for (const r of tr) {
      if (!tm.has(r.post_id)) tm.set(r.post_id, []);
      tm.get(r.post_id)!.push({ id: r.id, slug: r.slug, title: r.title, created_at: r.created_at });
    }
    return rows.map((row) => ({
      ...row, featured: !!row.featured,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      topics: tm.get(row.id) ?? [],
    }));
  }

  private async hydrateRow(row: BlogPostRow): Promise<BlogPost> {
    const { results: topics } = await this.db.prepare(Q.TOPICS_FOR).bind(row.id).all<BlogTopicRow>();
    return { ...row, featured: !!row.featured, metadata: row.metadata ? JSON.parse(row.metadata) : null, topics };
  }

  private async uniqueSlug(base: string): Promise<string> {
    const row = await this.db.prepare(Q.SLUG_EXISTS).bind(base).first<{ count: number }>();
    if (!row || row.count === 0) return base;
    for (let i = 2; i < 100; i++) {
      const c = `${base}-${i}`;
      const check = await this.db.prepare(Q.SLUG_EXISTS).bind(c).first<{ count: number }>();
      if (!check || check.count === 0) return c;
    }
    return `${base}-${Date.now()}`;
  }
}
