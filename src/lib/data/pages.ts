import type { PageRow, Page, TagRow } from '../core/types';
import { slugify } from '../core/slugify';

const Q = {
  LIST_ALL: `SELECT * FROM pages ORDER BY updated_at DESC`,
  BY_SLUG: `SELECT * FROM pages WHERE slug = ?1`,
  BY_ID: `SELECT * FROM pages WHERE id = ?1`,
  INSERT: `
    INSERT INTO pages (slug, title, content, image_key, image_url, status)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING *`,
  UPDATE: `
    UPDATE pages SET title = ?1, content = ?2, image_key = ?3, image_url = ?4,
      status = ?5, updated_at = datetime('now')
    WHERE id = ?6 RETURNING *`,
  DELETE: `DELETE FROM pages WHERE id = ?1`,
  TAGS_FOR_PAGE: `
    SELECT t.* FROM tags t
    JOIN page_tags pt ON pt.tag_id = t.id
    WHERE pt.page_id = ?1 ORDER BY t.title`,
  DELETE_PAGE_TAGS: `DELETE FROM page_tags WHERE page_id = ?1`,
  INSERT_PAGE_TAG: `INSERT OR IGNORE INTO page_tags (page_id, tag_id) VALUES (?1, ?2)`,
} as const;

export class PageService {
  constructor(private db: D1Database) {}

  async listAll(): Promise<PageRow[]> {
    const { results } = await this.db.prepare(Q.LIST_ALL).all<PageRow>();
    return results;
  }

  async getBySlug(slug: string): Promise<Page | null> {
    const row = await this.db.prepare(Q.BY_SLUG).bind(slug).first<PageRow>();
    if (!row) return null;
    const tags = await this.getTagsForPage(row.id);
    return { ...row, tags };
  }

  async getById(id: number): Promise<Page | null> {
    const row = await this.db.prepare(Q.BY_ID).bind(id).first<PageRow>();
    if (!row) return null;
    const tags = await this.getTagsForPage(row.id);
    return { ...row, tags };
  }

  async getTagsForPage(pageId: number): Promise<TagRow[]> {
    const { results } = await this.db
      .prepare(Q.TAGS_FOR_PAGE).bind(pageId).all<TagRow>();
    return results;
  }

  async create(data: {
    slug?: string;
    title: string;
    content?: string;
    image_key?: string | null;
    image_url?: string | null;
    status?: string;
    tag_ids?: number[];
  }): Promise<Page> {
    const slug = data.slug?.trim() || slugify(data.title);
    const row = await this.db
      .prepare(Q.INSERT)
      .bind(
        slug, data.title, data.content ?? '',
        data.image_key ?? null, data.image_url ?? null,
        data.status ?? 'draft',
      )
      .first<PageRow>();
    if (!row) throw new Error('Failed to create page');
    if (data.tag_ids?.length) await this.syncTags(row.id, data.tag_ids);
    const tags = await this.getTagsForPage(row.id);
    return { ...row, tags };
  }

  async update(id: number, data: {
    title?: string;
    content?: string;
    image_key?: string | null;
    image_url?: string | null;
    status?: string;
    tag_ids?: number[];
  }): Promise<Page> {
    const existing = await this.db
      .prepare(Q.BY_ID).bind(id).first<PageRow>();
    if (!existing) throw new Error('Page not found');
    const imgKey = data.image_key !== undefined ? data.image_key : existing.image_key;
    const imgUrl = data.image_url !== undefined ? data.image_url : existing.image_url;
    const row = await this.db
      .prepare(Q.UPDATE)
      .bind(
        data.title ?? existing.title,
        data.content ?? existing.content,
        imgKey, imgUrl,
        data.status ?? existing.status,
        id,
      )
      .first<PageRow>();
    if (!row) throw new Error('Failed to update page');
    if (data.tag_ids !== undefined) await this.syncTags(id, data.tag_ids);
    const tags = await this.getTagsForPage(id);
    return { ...row, tags };
  }

  async syncTags(pageId: number, tagIds: number[]): Promise<void> {
    await this.db.prepare(Q.DELETE_PAGE_TAGS).bind(pageId).run();
    if (!tagIds.length) return;
    const stmts = tagIds.map((tid) =>
      this.db.prepare(Q.INSERT_PAGE_TAG).bind(pageId, tid),
    );
    await this.db.batch(stmts);
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare(Q.DELETE_PAGE_TAGS).bind(id).run();
    await this.db.prepare(Q.DELETE).bind(id).run();
  }
}
