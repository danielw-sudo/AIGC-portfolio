# AIGC Portfolio — Dev Log

## 2026-03-18 — Astro 6 Upgrade & Debt Cleanup

**What shipped:**
- **Astro 6 upgrade**: 5.17→6.0.6, adapter 12.6→13.1.2 (vite-based build pipeline)
- **Breaking migration**: 60 files moved from `Astro.locals.runtime.env` → `import { env } from "cloudflare:workers"`
- **Adapter config**: `platformProxy` replaced with flat `configPath` + `persistState` + `remoteBindings: false`
- **Build simplification**: removed `wrangler types` from build/dev/preview scripts and CI — adapter generates types during build
- **wrangler.json**: removed `main` field (vite handles output), placeholders lowercased for stricter validation
- Gallery in-page tag/model filtering via `?tag=slug` / `?model=slug` URL params with active highlight
- Zero-count tags/models hidden from `/tags/` and `/models/` public listings
- Butler prompt deduplicated to `src/lib/ai/butler-prompt.ts`
- `public/llms.txt` added for AI discoverability
- ROADMAP pruned: removed 6 deferred items, Phase 5 Modernization completed
- All docs updated (README x3, CLAUDE.md, rules.md, llms.txt, ROADMAP.md)

**Decisions:**
- `entries.ts` (381 lines) — exception granted, no split. Tightly coupled hydration logic makes clean seams impossible.
- `remoteBindings: false` required for template repos — new adapter tries to auth to CF API during build.
- Astro Themes submission unblocked now that Astro 6 is done.

---

## 2026-03-18 — Pre-Ship Polish & Distribution

**What shipped:**
- README rewrite: emotion-first positioning, trilingual (EN/ZH/JA) (`bda0ea5`)
- Setup docs split: 668-line SETUP.md → 3 language-specific files (SETUP-en/zh/ja.md)
- Real AI art samples replacing SVG placeholders (kittens, whale-ride, winter-village)
- Butler chat: system prompt now injects site context (site name, entry count, recent entries)
- Social preview image replaced with actual project card (`e1771ee`)
- GitHub topics added: serverless, cloudflare-workers, ai-art, zero-cost, astro-template, d1-database, multi-llm, r2-storage, ai-portfolio

**Distribution:**
- GitHub release v1.3.0 created
- Awesome-astro PR: pending (user to submit)
- Awesome-cloudflare: identified as next target
- Cloudflare templates: proposal drafted, pending user submission
- Astro Themes: blocked until Astro 6 upgrade

**Strategic note:** AaaS thesis captured — "make everything API (frontend, db, admin), give API keys to IDE/Claude Code". Deferred to future sprint.

---

## 2026-03-17 — CI Workflow Fix

**Problem:** Deploy workflow ran on every push to `main`, failed with red X on template forks (no credentials configured). Bad first impression.

**What shipped:**
- Workflow now uses `workflow_dispatch` + secret-gated push trigger (`67ea610`)
- On push: silently skips if `CLOUDFLARE_API_TOKEN` is missing
- On manual dispatch: always runs, with actionable error if token missing
- SETUP.md Step 5 updated in all 3 languages to reflect new deploy flow

**Decision:** Option C (both triggers) — quiet for template forks, automatic once credentials are added.
