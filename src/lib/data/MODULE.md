# Module: data

## Purpose
D1 database services. All SQL queries live here. Service classes accept D1Database via constructor injection.

## Depends On
- `core` — types, slugify

## Exposes

### Services
- `EntryService(db)` — CRUD, search, pagination, tag hydration
  - `.listPublished(page)`, `.getById(id)`, `.getBySlug(slug)`, `.create(input)`, `.update(id, input)`, `.delete(id)`, `.search(query, page)`
  - `.listByModel(modelId, page)`, `.listByTag(tagId, page)`, `.listFeatured(limit)`
- `TaxonomyService(db)` — Models & Tags CRUD
  - `.getAllModels()`, `.getModelById(id)`, `.getModelBySlug(slug)`, `.createModel(input)`, `.updateModel(id, input)`, `.deleteModel(id)`
  - `.getAllTags()`, `.getTagById(id)`, `.getTagBySlug(slug)`, `.createTag(input)`, `.updateTag(id, input)`, `.deleteTag(id)`
- `EntryImageService(db)` — gallery images per entry
  - `.listByEntry(entryId)`, `.add(entryId, data)`, `.remove(id)`, `.getById(id)`
- `PageService(db)` — pages with tags
  - `.listAll()`, `.getById(id)`, `.getBySlug(slug)`, `.create(input)`, `.update(id, input)`, `.delete(id)`
- `SettingsService(db)` — key-value config + AI config
  - `.get(key)`, `.set(key, value)`, `.getAIConfig()`, `.getBlogAIConfig()`
- `MigrationService(db)` — execute & track D1 schema migrations
  - `.list()`, `.hashExists(hash)`, `.execute(name, sql, hash)`

### Blog Services (in `blog/` subfolder)
- `BlogPostService(db)` — blog post CRUD, search, pagination, topic hydration
  - `.listPublished(page)`, `.listByTopic(topicId, page)`, `.search(query, page)`
  - `.listAllFiltered({ page, q, status, sort })`, `.listFeatured(limit)`
  - `.getBySlug(slug)`, `.getById(id)`, `.create(input)`, `.update(id, input)`, `.delete(id)`
  - `.syncTopics(postId, topicIds)`
- `BlogTopicService(db)` — blog topic CRUD
  - `.getAll()`, `.getBySlug(slug)`, `.getById(id)`, `.getWithCount()`
  - `.create(title)`, `.upsert(slug, title)`, `.update(id, data)`, `.delete(id)`

## Files
| File | Lines | Purpose |
|------|-------|---------|
| entries.ts | 295 | Entry CRUD, search, tag hydration |
| taxonomy.ts | 143 | Model & Tag CRUD |
| pages.ts | 118 | Page CRUD with tags |
| images.ts | 89 | Entry image gallery |
| settings.ts | 52 | Settings key-value + AI config |
| migrations.ts | 50 | Migration runner + tracking |
| index.ts | 6 | Barrel exports |
| blog/posts.ts | 200 | Blog post CRUD, search, topic hydration |
| blog/topics.ts | 75 | Blog topic CRUD |
| blog/index.ts | 2 | Blog barrel exports |

## Used By
- All API routes (`api/entries`, `api/tags`, `api/models`, `api/pages`, `api/settings`, `api/analyze`, `api/blog`, `api/blog-topics`, `api/blog-analyze`)
- All admin pages (server-side data fetching)
- Public pages (server-side rendering)
