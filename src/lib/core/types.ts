// === Row types (match D1 schema exactly) ===

export interface ModelRow {
  id: number;
  slug: string;
  title: string;
  provider: string | null;
  created_at: string;
}

export interface TagRow {
  id: number;
  slug: string;
  title: string;
  created_at: string;
}

export interface EntryRow {
  id: number;
  slug: string;
  title: string;
  prompt: string | null;
  negative_prompt: string | null;
  description: string | null;
  model_id: number | null;
  source_url: string | null;
  image_key: string;
  image_url: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string;
  status: 'draft' | 'published';
  featured: number; // SQLite boolean 0/1
  source_type: string;
  metadata: string | null; // JSON string
  prompt_params: string | null; // JSON string — generation parameters
  created_at: string;
  updated_at: string;
}

export interface EntryTagRow {
  entry_id: number;
  tag_id: number;
}

export interface EntryImageRow {
  id: number;
  entry_id: number;
  image_key: string;
  image_url: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string;
  sort_order: number;
  created_at: string;
}

export interface PageRow {
  id: number;
  slug: string;
  title: string;
  content: string;
  image_key: string | null;
  image_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface PageTagRow {
  page_id: number;
  tag_id: number;
}

export interface Page extends PageRow {
  tags?: TagRow[];
}

// === Domain types (enriched for templates) ===

export interface Entry extends Omit<EntryRow, 'featured' | 'metadata' | 'prompt_params'> {
  featured: boolean;
  metadata: Record<string, unknown> | null;
  prompt_params: Record<string, unknown> | null;
  model?: ModelRow | null;
  tags?: TagRow[];
  images?: EntryImageRow[];
}

export interface TagWithCount extends TagRow {
  entry_count: number;
}

export interface ModelWithCount extends ModelRow {
  entry_count: number;
}

// === API types ===

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateEntryInput {
  title: string;
  slug?: string;
  prompt?: string;
  negative_prompt?: string;
  description?: string;
  model_id?: number;
  source_url?: string;
  image_key: string;
  image_url: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  source_type?: string;
  metadata?: Record<string, unknown>;
  prompt_params?: Record<string, unknown>;
  tag_ids?: number[];
}

export interface UpdateEntryInput extends Partial<CreateEntryInput> {}

// === Blog types ===

export interface BlogTopicRow {
  id: number;
  slug: string;
  title: string;
  created_at: string;
}

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  image_key: string | null;
  image_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string;
  status: 'draft' | 'published';
  featured: number; // SQLite boolean 0/1
  metadata: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface BlogPost extends Omit<BlogPostRow, 'featured' | 'metadata'> {
  featured: boolean;
  metadata: Record<string, unknown> | null;
  topics?: BlogTopicRow[];
}

export interface BlogTopicWithCount extends BlogTopicRow {
  post_count: number;
}

export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  summary?: string;
  body?: string;
  image_key?: string;
  image_url?: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  metadata?: Record<string, unknown>;
  topic_ids?: number[];
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {}
