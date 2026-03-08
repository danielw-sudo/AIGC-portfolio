import type { EntryImageRow } from '../core/types';

const Q = {
  LIST: `SELECT * FROM entry_images WHERE entry_id = ?1 ORDER BY sort_order`,
  BY_ID: `SELECT * FROM entry_images WHERE id = ?1`,
  INSERT: `
    INSERT INTO entry_images (entry_id, image_key, image_url, width, height, file_size, mime_type, sort_order)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING *`,
  DELETE: `DELETE FROM entry_images WHERE id = ?1 RETURNING *`,
  DELETE_BY_ENTRY: `DELETE FROM entry_images WHERE entry_id = ?1`,
  LIST_BY_ENTRY_KEYS: `SELECT image_key FROM entry_images WHERE entry_id = ?1`,
  MAX_SORT: `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM entry_images WHERE entry_id = ?1`,
  UPDATE_SORT: `UPDATE entry_images SET sort_order = ?1 WHERE id = ?2`,
  SET_COVER: `
    UPDATE entries SET image_key = ?1, image_url = ?2, width = ?3, height = ?4,
      file_size = ?5, mime_type = ?6, updated_at = datetime('now')
    WHERE id = ?7`,
} as const;

export class EntryImageService {
  constructor(private db: D1Database) {}

  async listByEntry(entryId: number): Promise<EntryImageRow[]> {
    const { results } = await this.db.prepare(Q.LIST).bind(entryId).all<EntryImageRow>();
    return results;
  }

  async add(entryId: number, data: {
    image_key: string;
    image_url: string;
    width?: number | null;
    height?: number | null;
    file_size?: number | null;
    mime_type?: string;
  }): Promise<EntryImageRow> {
    const maxRow = await this.db.prepare(Q.MAX_SORT).bind(entryId).first<{ max_sort: number }>();
    const sortOrder = (maxRow?.max_sort ?? -1) + 1;

    const row = await this.db.prepare(Q.INSERT).bind(
      entryId,
      data.image_key,
      data.image_url,
      data.width ?? null,
      data.height ?? null,
      data.file_size ?? null,
      data.mime_type ?? 'image/jpeg',
      sortOrder,
    ).first<EntryImageRow>();

    if (!row) throw new Error('Failed to add image');
    return row;
  }

  async remove(id: number): Promise<EntryImageRow | null> {
    return await this.db.prepare(Q.DELETE).bind(id).first<EntryImageRow>();
  }

  async removeAllByEntry(entryId: number): Promise<string[]> {
    const { results } = await this.db
      .prepare(Q.LIST_BY_ENTRY_KEYS)
      .bind(entryId)
      .all<{ image_key: string }>();
    const keys = results.map((r) => r.image_key);
    await this.db.prepare(Q.DELETE_BY_ENTRY).bind(entryId).run();
    return keys;
  }

  async reorder(entryId: number, imageIds: number[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await this.db.prepare(Q.UPDATE_SORT).bind(i, imageIds[i]).run();
    }
  }

  async setCover(entryId: number, imageId: number): Promise<void> {
    const img = await this.db.prepare(Q.BY_ID).bind(imageId).first<EntryImageRow>();
    if (!img || img.entry_id !== entryId) throw new Error('Image not found');

    // Move this image to sort_order 0, shift others
    const all = await this.listByEntry(entryId);
    const reordered = [imageId, ...all.filter((i) => i.id !== imageId).map((i) => i.id)];
    await this.reorder(entryId, reordered);

    // Sync cover fields back to entries table
    await this.db.prepare(Q.SET_COVER).bind(
      img.image_key, img.image_url, img.width, img.height,
      img.file_size, img.mime_type, entryId,
    ).run();
  }
}
