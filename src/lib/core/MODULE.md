# Module: core

## Purpose
Shared types, pure utility functions, and R2 storage helpers. Leaf module — everything else imports from here.

## Depends On
None (leaf)

## Exposes

### Types (`types.ts`)
- `EntryRow`, `Entry`, `CreateEntryInput`, `UpdateEntryInput`
- `TagRow`, `ModelRow`, `PageRow`, `Page`, `EntryImageRow`
- `PaginatedResponse<T>`, `ModelWithCount`, `TagWithCount`

### Functions
- `slugify(text: string): string` — URL-safe slug generation
- `getImageDimensions(buffer: ArrayBuffer): { width, height } | null` — JPEG/PNG binary header parse
- `generateImageKey(slug?, mime?)`, `uploadImage(bucket, key, data, mime)`, `deleteImage(bucket, key)` — R2 ops
- `getPublicUrl(key)`, `ensureUniqueKey(bucket, key)` — R2 helpers

## Files
| File | Lines | Purpose |
|------|-------|---------|
| types.ts | 129 | All DB row + domain types |
| slugify.ts | 16 | URL slug generation |
| r2.ts | 56 | R2 bucket utilities |
| image-dimensions.ts | 106 | JPEG/PNG dimension extraction |
| index.ts | 4 | Barrel exports |

## Used By
- `data` module (types, slugify)
- `ai` module (types)
- API routes (r2, slugify, image-dimensions)
- Components (types)
