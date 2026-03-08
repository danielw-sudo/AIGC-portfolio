import type { ModelRow, TagRow, ModelWithCount, TagWithCount } from '../core/types';
import { slugify } from '../core/slugify';

const Q = {
  ALL_MODELS: 'SELECT * FROM models ORDER BY title',
  MODEL_BY_SLUG: 'SELECT * FROM models WHERE slug = ?1',
  MODEL_BY_ID: 'SELECT * FROM models WHERE id = ?1',
  MODELS_WITH_COUNT: `
    SELECT m.*, COUNT(e.id) as entry_count
    FROM models m
    LEFT JOIN entries e ON e.model_id = m.id AND e.status = 'published'
    GROUP BY m.id ORDER BY m.title`,
  INSERT_MODEL: `INSERT INTO models (slug, title, provider) VALUES (?1, ?2, ?3) RETURNING *`,
  UPDATE_MODEL: `UPDATE models SET title = ?1, provider = ?2 WHERE id = ?3 RETURNING *`,
  DELETE_MODEL: `DELETE FROM models WHERE id = ?1`,
  NULLIFY_MODEL_ENTRIES: `UPDATE entries SET model_id = NULL WHERE model_id = ?1`,
  ALL_TAGS: 'SELECT * FROM tags ORDER BY title',
  TAG_BY_SLUG: 'SELECT * FROM tags WHERE slug = ?1',
  TAG_BY_ID: 'SELECT * FROM tags WHERE id = ?1',
  TAGS_WITH_COUNT: `
    SELECT t.*, COUNT(et.entry_id) as entry_count
    FROM tags t
    LEFT JOIN entry_tags et ON et.tag_id = t.id
    LEFT JOIN entries e ON e.id = et.entry_id AND e.status = 'published'
    GROUP BY t.id ORDER BY t.title`,
  INSERT_TAG: `INSERT INTO tags (slug, title) VALUES (?1, ?2) RETURNING *`,
  UPSERT_TAG: `
    INSERT INTO tags (slug, title) VALUES (?1, ?2)
    ON CONFLICT(slug) DO UPDATE SET title = excluded.title
    RETURNING *`,
  UPDATE_TAG: `UPDATE tags SET title = ?1 WHERE id = ?2 RETURNING *`,
  DELETE_TAG: `DELETE FROM tags WHERE id = ?1`,
  DELETE_ENTRY_TAGS: `DELETE FROM entry_tags WHERE tag_id = ?1`,
} as const;

export class TaxonomyService {
  constructor(private db: D1Database) {}

  // --- Models ---

  async getAllModels(): Promise<ModelRow[]> {
    const { results } = await this.db.prepare(Q.ALL_MODELS).all<ModelRow>();
    return results;
  }

  async getModelBySlug(slug: string): Promise<ModelRow | null> {
    return await this.db.prepare(Q.MODEL_BY_SLUG).bind(slug).first<ModelRow>();
  }

  async getModelById(id: number): Promise<ModelRow | null> {
    return await this.db.prepare(Q.MODEL_BY_ID).bind(id).first<ModelRow>();
  }

  async getModelsWithCount(): Promise<ModelWithCount[]> {
    const { results } = await this.db
      .prepare(Q.MODELS_WITH_COUNT)
      .all<ModelWithCount>();
    return results;
  }

  async createModel(title: string, provider?: string): Promise<ModelRow> {
    const slug = slugify(title);
    const row = await this.db
      .prepare(Q.INSERT_MODEL)
      .bind(slug, title, provider ?? null)
      .first<ModelRow>();
    if (!row) throw new Error('Failed to create model');
    return row;
  }

  async updateModel(id: number, data: { title?: string; provider?: string }): Promise<ModelRow> {
    const existing = await this.getModelById(id);
    if (!existing) throw new Error('Model not found');
    const provider = data.provider !== undefined ? (data.provider || null) : existing.provider;
    const row = await this.db
      .prepare(Q.UPDATE_MODEL)
      .bind(data.title ?? existing.title, provider, id)
      .first<ModelRow>();
    if (!row) throw new Error('Failed to update model');
    return row;
  }

  async deleteModel(id: number): Promise<void> {
    await this.db.prepare(Q.NULLIFY_MODEL_ENTRIES).bind(id).run();
    await this.db.prepare(Q.DELETE_MODEL).bind(id).run();
  }

  // --- Tags ---

  async getAllTags(): Promise<TagRow[]> {
    const { results } = await this.db.prepare(Q.ALL_TAGS).all<TagRow>();
    return results;
  }

  async getTagBySlug(slug: string): Promise<TagRow | null> {
    return await this.db.prepare(Q.TAG_BY_SLUG).bind(slug).first<TagRow>();
  }

  async getTagById(id: number): Promise<TagRow | null> {
    return await this.db.prepare(Q.TAG_BY_ID).bind(id).first<TagRow>();
  }

  async getTagsWithCount(): Promise<TagWithCount[]> {
    const { results } = await this.db
      .prepare(Q.TAGS_WITH_COUNT)
      .all<TagWithCount>();
    return results;
  }

  async upsertTag(slug: string, title: string): Promise<TagRow> {
    const row = await this.db
      .prepare(Q.UPSERT_TAG)
      .bind(slug, title)
      .first<TagRow>();
    if (!row) throw new Error(`Failed to upsert tag: ${slug}`);
    return row;
  }

  async createTag(slug: string, title: string): Promise<TagRow> {
    const row = await this.db
      .prepare(Q.INSERT_TAG)
      .bind(slug, title)
      .first<TagRow>();
    if (!row) throw new Error(`Failed to create tag: ${slug}`);
    return row;
  }

  async updateTag(id: number, data: { title?: string }): Promise<TagRow> {
    const existing = await this.getTagById(id);
    if (!existing) throw new Error('Tag not found');
    const row = await this.db
      .prepare(Q.UPDATE_TAG)
      .bind(data.title ?? existing.title, id)
      .first<TagRow>();
    if (!row) throw new Error('Failed to update tag');
    return row;
  }

  async deleteTag(id: number): Promise<void> {
    await this.db.prepare(Q.DELETE_ENTRY_TAGS).bind(id).run();
    await this.db.prepare(Q.DELETE_TAG).bind(id).run();
  }
}
