# AIGC Portfolio — Dev Log

## 2026-03-17 — Onboarding Experience (Phase 4e)

**Goal:** Reduce drop-off for non-technical creators after deploy.

**Problem:** Fresh deploys landed on an empty site with a static Quick Start Guide. Users didn't know what the site could look like or what to do next.

**What shipped:**
- Seed content: 3 SVG placeholder gallery entries + welcome blog post + tags + hero defaults (`0010_seed_content.sql`)
- Smart onboarding checklist (`OnboardingChecklist.astro`) — server-rendered, queries actual DB state, tracks 6 steps: personalize site, upload first artwork, try AI analyze, write first post, remove samples, secure admin
- Clear samples API (`POST /api/admin/clear-samples`) — deletes all `source_type = 'sample'` entries + R2 objects
- Hero live preview in Site Config — updates as you type title/subtitle/CTAs
- Ghost skeleton empty state on public homepage
- setup.sh: uploads SVGs to R2, seeds content with R2 URL substitution

**Decisions:**
- SVG placeholders over real images: zero external dependencies, obvious they're samples, tiny file size
- Checklist over wizard: lower effort, no dead-code maintenance, still guides step-by-step
- `source_type = 'sample'` for cleanup (column already existed in schema)
- Hero preview cherry-picked from wizard approach — highest emotional impact, lowest cost

**Files created:** 7 | **Files modified:** 5 | Build: clean
