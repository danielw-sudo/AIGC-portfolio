# Module: admin-ui

## Purpose
Shared client-side JS for admin form pages. DOM helpers, image upload/scrape, tag creation, AI analyze with per-field suggestions.

## Depends On
None (talks to API via fetch, no TS module imports)

## Exposes

### DOM Helpers (`form-helpers.ts`)
- `showMessage(el, text, isError)` — flash success/error banner
- `setupDropZone(dzId, fiId, handler)` — wire drop zone + file input
- `setupTabs(aId, bId, pAId, pBId)` — toggle two tab panels
- `makeProg(barId, statusId, wrapId): ProgressHelper` — progress bar controller

### Upload (`upload.ts`)
- `uploadFile(file, slugHint?): Promise<UploadResult>` — POST /api/upload
- `scrapeImage(url, slugHint?): Promise<UploadResult>` — POST /api/scrape
- `UploadResult` — { image_key, image_url, mime_type, file_size, width?, height? }

### Tag Manager (`tag-manager.ts`)
- `initTagManager(opts)` — wire tag input/button, create via POST /api/tags

### AI Analyze (`ai-analyze.ts`)
- `initAIAnalyze(opts)` — wire analyze button, call POST /api/analyze, render suggestions
- `getAIAssisted()` — returns AI-assisted metadata for form submit
- `AIAnalyzeOpts` — { btnId, tierId, promptId, descriptionId, titleId, tagListId, suggestionsId, imageUrlId?, onMessage }

### AI Suggestions (`ai-suggestions.ts`)
- `renderSuggestions(data, targets)` — render per-field accept/reject panel
- `getAIAssisted()` — returns `{ title?, description?, tags?, vision?, timestamp }` tracking
- `AISuggestionData` — { title, description, tags[], newTags[], textModel, visionTags?, visionModel?, visionError? }
- `SuggestionTargets` — { containerId, titleId, descriptionId, tagListId, onMessage }

## Files
| File | Lines | Purpose |
|------|-------|---------|
| form-helpers.ts | 75 | DOM helpers (drop zone, tabs, progress, message) |
| upload.ts | 33 | Upload + scrape fetch wrappers |
| tag-manager.ts | 55 | Tag creation + checkbox list management |
| ai-analyze.ts | 97 | AI analyze button handler + suggestion orchestration |
| ai-suggestions.ts | 191 | Per-field suggestion panel (accept/reject, tag creation) |
| index.ts | 11 | Barrel exports |

## Used By
- `admin/new.astro` — entry creation form
- `admin/[id].astro` — entry edit form
- `admin/pages/new.astro` — page creation form
- `admin/pages/[id].astro` — page edit form
