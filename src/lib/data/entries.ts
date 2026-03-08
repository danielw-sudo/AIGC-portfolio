import type {
  EntryRow,
  Entry,
  TagRow,
  ModelRow,
  PaginatedResponse,
  CreateEntryInput,
  UpdateEntryInput,
} from '../core/types';
import { slugify } from '../core/slugify';

const PER_PAGE = 24;

const Q = {
  LIST_PUBLISHED: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.status = 'published'
    ORDER BY e.created_at DESC LIMIT ?1 OFFSET ?2`,
  COUNT_PUBLISHED: `SELECT COUNT(*) as total FROM entries WHERE status = 'published'`,
  LIST_ALL: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    ORDER BY e.created_at DESC LIMIT ?1 OFFSET ?2`,
  COUNT_ALL: `SELECT COUNT(*) as total FROM entries`,
  BY_SLUG: `
    SELECT e.*, m.title as m_title, m.slug as m_slug,
           m.provider as m_provider, m.id as m_id
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.slug = ?1`,
  BY_ID: `SELECT * FROM entries WHERE id = ?1`,
  TAGS_FOR_ENTRY: `
    SELECT t.* FROM tags t
    JOIN entry_tags et ON et.tag_id = t.id
    WHERE et.entry_id = ?1 ORDER BY t.title`,
  TAGS_FOR_ENTRIES: `
    SELECT et.entry_id, t.* FROM entry_tags et
    JOIN tags t ON t.id = et.tag_id
    ORDER BY t.title`,
  INSERT: `
    INSERT INTO entries (slug, title, prompt, negative_prompt, description,
      model_id, source_url, image_key, image_url, width, height,
      file_size, mime_type, status, featured, source_type, metadata)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
    RETURNING *`,
  UPDATE: `
    UPDATE entries SET title = ?1, prompt = ?2, negative_prompt = ?3,
      description = ?4, model_id = ?5, source_url = ?6, image_key = ?7,
      image_url = ?8, width = ?9, height = ?10, file_size = ?11,
      mime_type = ?12, status = ?13, featured = ?14, source_type = ?15,
      metadata = ?16, updated_at = datetime('now')
    WHERE id = ?17 RETURNING *`,
  DELETE: `DELETE FROM entries WHERE id = ?1`,
  CLEAR_TAGS: `DELETE FROM entry_tags WHERE entry_id = ?1`,
  ADD_TAG: `INSERT INTO entry_tags (entry_id, tag_id) VALUES (?1, ?2)`,
  SLUG_EXISTS: `SELECT COUNT(*) as count FROM entries WHERE slug = ?1`,
  LIST_BY_MODEL: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.status = 'published' AND e.model_id = ?1
    ORDER BY e.created_at DESC LIMIT ?2 OFFSET ?3`,
  COUNT_BY_MODEL: `SELECT COUNT(*) as total FROM entries WHERE status = 'published' AND model_id = ?1`,
  LIST_BY_TAG: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    JOIN entry_tags et ON et.entry_id = e.id
    WHERE e.status = 'published' AND et.tag_id = ?1
    ORDER BY e.created_at DESC LIMIT ?2 OFFSET ?3`,
  COUNT_BY_TAG: `
    SELECT COUNT(*) as total FROM entries e
    JOIN entry_tags et ON et.entry_id = e.id
    WHERE e.status = 'published' AND et.tag_id = ?1`,
  SEARCH_PUBLISHED: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.status = 'published' AND (e.title LIKE ?1 OR e.prompt LIKE ?1)
    ORDER BY e.created_at DESC LIMIT ?2 OFFSET ?3`,
  COUNT_SEARCH: `
    SELECT COUNT(*) as total FROM entries
    WHERE status = 'published' AND (title LIKE ?1 OR prompt LIKE ?1)`,
  FEATURED: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.status = 'published' AND e.featured = 1
    ORDER BY e.created_at DESC LIMIT ?1`,
  RELATED_BY_TAGS: `
    SELECT DISTINCT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    JOIN entry_tags et ON et.entry_id = e.id
    WHERE e.status = 'published' AND e.id != ?1
      AND et.tag_id IN (SELECT tag_id FROM entry_tags WHERE entry_id = ?1)
    ORDER BY RANDOM() LIMIT ?2`,
  FEATURED_EXCLUDING: `
    SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
    FROM entries e LEFT JOIN models m ON e.model_id = m.id
    WHERE e.status = 'published' AND e.featured = 1 AND e.id != ?1
    ORDER BY RANDOM() LIMIT ?2`,
} as const;

export class EntryService {
  constructor(private db: D1Database) {}

  async listPublished(page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<Entry>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(Q.LIST_PUBLISHED).bind(perPage, offset).all(),
      this.db.prepare(Q.COUNT_PUBLISHED).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async listFeatured(limit = 4): Promise<Entry[]> {
    const { results } = await this.db.prepare(Q.FEATURED).bind(limit).all();
    return this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
  }

  async listRelated(entryId: number, limit = 3): Promise<Entry[]> {
    const { results } = await this.db.prepare(Q.RELATED_BY_TAGS).bind(entryId, limit).all();
    if (results.length > 0) return this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    const { results: featured } = await this.db.prepare(Q.FEATURED_EXCLUDING).bind(entryId, limit).all();
    return this.hydrateRows(featured as (EntryRow & Record<string, unknown>)[]);
  }

  async listByModel(modelId: number, page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<Entry>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(Q.LIST_BY_MODEL).bind(modelId, perPage, offset).all(),
      this.db.prepare(Q.COUNT_BY_MODEL).bind(modelId).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async listByTag(tagId: number, page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<Entry>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(Q.LIST_BY_TAG).bind(tagId, perPage, offset).all(),
      this.db.prepare(Q.COUNT_BY_TAG).bind(tagId).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async search(query: string, page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<Entry>> {
    page = Math.max(1, page);
    const like = `%${query}%`;
    const offset = (page - 1) * perPage;
    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(Q.SEARCH_PUBLISHED).bind(like, perPage, offset).all(),
      this.db.prepare(Q.COUNT_SEARCH).bind(like).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async listAllFiltered(opts: {
    page?: number; perPage?: number; q?: string; status?: string; sort?: string;
  } = {}): Promise<PaginatedResponse<Entry>> {
    const page = Math.max(1, opts.page ?? 1);
    const perPage = opts.perPage ?? PER_PAGE;
    const offset = (page - 1) * perPage;

    const wheres: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (opts.q) {
      wheres.push(`(e.title LIKE ?${idx} OR e.prompt LIKE ?${idx})`);
      params.push(`%${opts.q}%`);
      idx++;
    }
    if (opts.status === 'draft' || opts.status === 'published') {
      wheres.push(`e.status = ?${idx}`);
      params.push(opts.status);
      idx++;
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
    const orderMap: Record<string, string> = {
      newest: 'e.created_at DESC',
      oldest: 'e.created_at ASC',
      title: 'e.title ASC',
      updated: 'e.updated_at DESC',
    };
    const order = orderMap[opts.sort ?? ''] ?? 'e.created_at DESC';

    const listSql = `SELECT e.*, m.title as m_title, m.slug as m_slug, m.provider as m_provider
      FROM entries e LEFT JOIN models m ON e.model_id = m.id ${where}
      ORDER BY ${order} LIMIT ?${idx} OFFSET ?${idx + 1}`;
    const countSql = `SELECT COUNT(*) as total FROM entries e ${where}`;

    const listParams = [...params, perPage, offset];
    const countParams = [...params];

    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(listSql).bind(...listParams).all(),
      this.db.prepare(countSql).bind(...countParams).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async listAll(page = 1, perPage = PER_PAGE): Promise<PaginatedResponse<Entry>> {
    page = Math.max(1, page);
    const offset = (page - 1) * perPage;
    const [{ results }, countRow] = await Promise.all([
      this.db.prepare(Q.LIST_ALL).bind(perPage, offset).all(),
      this.db.prepare(Q.COUNT_ALL).first<{ total: number }>(),
    ]);
    const total = countRow?.total ?? 0;
    const entries = await this.hydrateRows(results as (EntryRow & Record<string, unknown>)[]);
    return { data: entries, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async getBySlug(slug: string): Promise<Entry | null> {
    const row = await this.db.prepare(Q.BY_SLUG).bind(slug).first();
    if (!row) return null;
    return this.hydrateRow(row as EntryRow & Record<string, unknown>);
  }

  async getById(id: number): Promise<EntryRow | null> {
    return await this.db.prepare(Q.BY_ID).bind(id).first<EntryRow>();
  }

  async create(input: CreateEntryInput): Promise<Entry> {
    const slug = input.slug || (await this.uniqueSlug(slugify(input.title)));
    const row = await this.db
      .prepare(Q.INSERT)
      .bind(
        slug, input.title, input.prompt ?? null, input.negative_prompt ?? null,
        input.description ?? null, input.model_id ?? null, input.source_url ?? null,
        input.image_key, input.image_url, input.width ?? null, input.height ?? null,
        input.file_size ?? null, input.mime_type ?? 'image/jpeg',
        input.status ?? 'draft', input.featured ? 1 : 0,
        input.source_type ?? 'manual',
        input.metadata ? JSON.stringify(input.metadata) : null,
      )
      .first<EntryRow>();
    if (!row) throw new Error('Failed to create entry');
    if (input.tag_ids?.length) {
      await this.syncTags(row.id, input.tag_ids);
    }
    return this.hydrateRow(row as EntryRow & Record<string, unknown>);
  }

  async update(id: number, input: UpdateEntryInput): Promise<Entry> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Entry ${id} not found`);
    const row = await this.db
      .prepare(Q.UPDATE)
      .bind(
        input.title ?? existing.title,
        input.prompt ?? existing.prompt,
        input.negative_prompt ?? existing.negative_prompt,
        input.description ?? existing.description,
        input.model_id ?? existing.model_id,
        input.source_url ?? existing.source_url,
        input.image_key ?? existing.image_key,
        input.image_url ?? existing.image_url,
        input.width ?? existing.width,
        input.height ?? existing.height,
        input.file_size ?? existing.file_size,
        input.mime_type ?? existing.mime_type,
        input.status ?? existing.status,
        input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured,
        input.source_type ?? existing.source_type,
        input.metadata ? JSON.stringify(input.metadata) : existing.metadata,
        id,
      )
      .first<EntryRow>();
    if (!row) throw new Error(`Failed to update entry ${id}`);
    if (input.tag_ids !== undefined) {
      await this.syncTags(id, input.tag_ids);
    }
    return this.hydrateRow(row as EntryRow & Record<string, unknown>);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare(Q.DELETE).bind(id).run();
    return result.meta.changes > 0;
  }

  async syncTags(entryId: number, tagIds: number[]): Promise<void> {
    await this.db.prepare(Q.CLEAR_TAGS).bind(entryId).run();
    for (const tagId of tagIds) {
      await this.db.prepare(Q.ADD_TAG).bind(entryId, tagId).run();
    }
  }

  private async hydrateRows(rows: (EntryRow & Record<string, unknown>)[]): Promise<Entry[]> {
    if (rows.length === 0) return [];

    const entryIds = rows.map((r) => r.id);
    const placeholders = entryIds.map(() => '?').join(',');
    const { results: tagRows } = await this.db
      .prepare(`SELECT et.entry_id, t.* FROM entry_tags et JOIN tags t ON t.id = et.tag_id WHERE et.entry_id IN (${placeholders}) ORDER BY t.title`)
      .bind(...entryIds)
      .all<TagRow & { entry_id: number }>();

    const tagMap = new Map<number, TagRow[]>();
    for (const row of tagRows) {
      const eid = row.entry_id;
      if (!tagMap.has(eid)) tagMap.set(eid, []);
      tagMap.get(eid)!.push({ id: row.id, slug: row.slug, title: row.title, created_at: row.created_at });
    }

    return rows.map((row) => {
      const model: ModelRow | null =
        row.m_id || row.model_id
          ? {
              id: (row.m_id as number) ?? row.model_id!,
              slug: (row.m_slug as string) ?? '',
              title: (row.m_title as string) ?? '',
              provider: (row.m_provider as string) ?? null,
              created_at: '',
            }
          : null;

      return {
        ...row,
        featured: !!row.featured,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
        model,
        tags: tagMap.get(row.id) ?? [],
      };
    });
  }

  private async hydrateRow(row: EntryRow & Record<string, unknown>): Promise<Entry> {
    const { results: tags } = await this.db
      .prepare(Q.TAGS_FOR_ENTRY)
      .bind(row.id)
      .all<TagRow>();

    const model: ModelRow | null =
      row.m_id || row.model_id
        ? {
            id: (row.m_id as number) ?? row.model_id!,
            slug: (row.m_slug as string) ?? '',
            title: (row.m_title as string) ?? '',
            provider: (row.m_provider as string) ?? null,
            created_at: '',
          }
        : null;

    return {
      ...row,
      featured: !!row.featured,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
      model,
      tags,
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    const row = await this.db.prepare(Q.SLUG_EXISTS).bind(base).first<{ count: number }>();
    if (!row || row.count === 0) return base;
    let counter = 2;
    let candidate: string;
    do {
      candidate = `${base}-${counter}`;
      counter++;
      const check = await this.db.prepare(Q.SLUG_EXISTS).bind(candidate).first<{ count: number }>();
      if (!check || check.count === 0) return candidate;
    } while (counter < 100);
    return `${base}-${Date.now()}`;
  }
}
