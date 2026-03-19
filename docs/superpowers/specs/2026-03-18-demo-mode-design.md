# Demo Mode — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Approach:** Feature flag in main repo, off by default

---

## Problem

The admin panel is the product's core value, but Cloudflare Zero Trust auth makes public demos impossible. Visitors can't experience the admin without deploying their own instance.

## Solution

A `DEMO_MODE` env var that, when enabled:
1. Bypasses auth — anyone can browse admin pages
2. Blocks all write operations — returns 403 with a helpful message
3. Returns mock AI responses — chat, analyze, blog-analyze
4. Shows a persistent banner explaining the restrictions

When `DEMO_MODE` is off (default), the code is completely inert. Users never see or interact with it.

---

## Trigger

```json
// wrangler.json (demo deploy only)
"vars": {
  "DEMO_MODE": "true"
}
```

Detection: `env.DEMO_MODE === "true"` via `import { env } from "cloudflare:workers"`.

---

## New Files

### `src/lib/core/demo.ts` (~60 lines)

```
isDemoMode()           → boolean
demoBlock()            → Response (403 JSON)
demoMockChat()         → Response (mock Butler reply)
demoMockAnalyze()      → Response (mock AI tags/description)
demoMockBlogAnalyze()  → Response (mock blog suggestions)
```

All mock responses should be clearly labeled with "[Demo]" prefix so visitors know they're not real AI output.

---

## Middleware Change

**File:** `src/middleware.ts`

No auth changes needed. Zero Trust is infrastructure-level — demo mode doesn't "skip" auth, it simply operates on a Worker that has no Zero Trust policy applied. The middleware stays as-is (security headers only).

---

## API Guard Strategy

**Pattern:** One-liner guard at the top of each write handler.

```typescript
import { isDemoMode, demoBlock } from '@/lib/core/demo';

export async function POST(ctx: APIContext) {
  if (isDemoMode()) return demoBlock();
  // ... existing code
}
```

### Write endpoints to guard (18 handlers across 15 files)

| File | Methods to guard |
|---|---|
| `api/entries.ts` | POST |
| `api/entries/[id].ts` | PUT, DELETE |
| `api/entries/[id]/images.ts` | POST, DELETE |
| `api/blog.ts` | POST |
| `api/blog/[id].ts` | PUT, DELETE |
| `api/blog-topics.ts` | POST |
| `api/blog-topics/normalize.ts` | POST |
| `api/tags.ts` | POST |
| `api/tags/[id].ts` | PUT, DELETE |
| `api/tags/normalize.ts` | POST |
| `api/models.ts` | POST |
| `api/models/[id].ts` | PUT, DELETE |
| `api/pages/index.ts` | POST |
| `api/pages/[id].ts` | PUT, DELETE |
| `api/settings.ts` | PUT |
| `api/upload.ts` | POST |
| `api/import.ts` | POST |
| `api/scrape.ts` | POST |
| `api/admin/migrations.ts` | POST |
| `api/admin/backfill-dimensions.ts` | POST |
| `api/admin/clear-samples.ts` | POST |
| `api/admin/r2-cleanup.ts` | DELETE |

### AI endpoints — mock instead of block (3 handlers)

| File | Method | Mock response |
|---|---|---|
| `api/chat.ts` | POST | `{ reply: "[Demo] I'm Butler, the AI assistant...", elapsed: 42 }` |
| `api/analyze.ts` | POST | `{ parsed: { tags, title, description }, textModel: "demo", markdown: "..." }` |
| `api/blog-analyze.ts` | POST | `{ parsed: { headline, summary, seoTitle }, textModel: "demo", markdown: "..." }` |

### Read endpoints — no change needed

All GET handlers work normally. Demo visitors can browse all admin data.

---

## Demo Banner

**File:** `src/layouts/AdminLayout.astro`

Inject after `</nav>`, before `<main>`. Only renders when `isDemoMode()` is true.

```
┌─────────────────────────────────────────────────────┐
│ 🔒 Demo Mode — writes disabled, AI responses mocked │
│ Fork this repo to deploy your own instance →         │
└─────────────────────────────────────────────────────┘
```

- Amber/warning color scheme (fits dark admin theme)
- Link to GitHub repo
- Not dismissible (it's important context for every page)

---

## What Does NOT Change

- No new dependencies
- No schema changes
- No changes to public routes (gallery, blog, tags, models)
- No changes to AdminLayout structure beyond the banner
- `DEMO_MODE` off = zero behavioral difference
- No auth logic added or removed (Zero Trust is infrastructure)

---

## Env Type

Add to `src/env.d.ts`:

```typescript
interface Env {
  DEMO_MODE?: string;  // "true" to enable demo mode
  // ... existing
}
```

---

## Verification

1. `DEMO_MODE` not set → all endpoints work normally, no banner
2. `DEMO_MODE=true` → admin pages load with banner, all writes return 403, AI returns mocks, reads work
3. Build passes with and without the flag
4. Public pages unaffected in both modes
