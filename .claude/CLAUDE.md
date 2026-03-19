# AIGC-portfolio — Claude Code Context
# Github: danielw-sudo/AIGC-portfolio (or your fork)
# Local: .../AIGC-portfolio — assign the local directory to keep the working path accurate
# Updated: 2026-03-17

---

## STANDALONE PROJECT

This is an **independent open-source template**. It is self-contained.

**All project context lives in this file and `ROADMAP.md`.**
Do not load context from parent directories or other projects.

---

## Vision

Accessible, affordable AI tools for everyone.
This template lets anyone deploy an AI-powered art gallery and blog to
Cloudflare's free tier — zero coding, zero cost to start.

The 0-code deploy is the entry point, not the ceiling:
- Dashboard-configurable AI (switch providers, tune prompts, no code)
- Direct API calls to LLMs — no middleware frameworks, no vendor lock-in
- Extensible architecture — gallery today, small business landing page tomorrow
- Agentic handoff configs (`.claude/`, `.antigravity/`) for developer on-ramp

---

## Architecture

```
Runtime:     Cloudflare Workers (edge SSR)
Framework:   Astro 6 (output: server)
Database:    Cloudflare D1 (serverless SQLite)
Storage:     Cloudflare R2 (S3-compatible)
AI:          Multi-provider — CF Workers AI, NVIDIA NIM, Google Gemini
Styling:     Tailwind CSS 4 (CSS-native @theme in global.css)
Icons:       Lucide (lucide-static, server-rendered via Icon.astro)
Auth:        Cloudflare Zero Trust (infrastructure-level, no in-app auth)
```

---

## Code Structure

```
src/
├── components/        UI components (pure Astro, zero React)
├── layouts/           MainLayout, AdminLayout
├── lib/
│   ├── ai/            Multi-provider AI routing (@cf/, @nv/, @google/)
│   ├── core/          R2 ops, image dimensions, types, slugify, date formatting
│   ├── data/          D1 query builders (entries, blog, pages, settings, taxonomy, audit, usage)
│   └── admin-ui/      Client-side admin helpers (AI analysis, uploads, forms, chat/)
├── pages/
│   ├── admin/         Admin panel (gallery, blog, pages, chat, audit, developer, settings)
│   ├── api/           REST endpoints (CRUD, AI analyze, upload, import, chat, normalize)
│   ├── blog/          Public blog routes
│   ├── gallery/       Public gallery (index only — detail via [slug])
│   ├── models/        Model listing/detail
│   └── tags/          Tag listing/detail
├── styles/            global.css (Tailwind V4 theme)
└── QuickStart/        Deployment docs (SETUP.md, DEPLOY_WITH_AI.md, API keys guide)
```

---

## Key Files

| File | Purpose |
|---|---|
| `schema.sql` | Full D1 schema (13 tables incl. ai_usage, 15+ indexes) |
| `wrangler.json` | CF Workers bindings (DB, IMAGES, AI, env vars) |
| `setup.sh` | Automated D1/R2 provisioning + deploy |
| `astro.config.mjs` | SSR + Cloudflare adapter + Tailwind V4 |
| `.antigravity/rules.md` | AI agent handoff context (Gemini/other agents) |
| `ROADMAP.md` | Feature roadmap + release history |

---

## AI Routing

Providers are selected via string prefix on the model ID:
- `@cf/...` → Cloudflare Workers AI (native binding)
- `@nv/...` → NVIDIA NIM (API call)
- `@google/...` → Google Gemini (API call)

Provider coupling: `src/lib/ai/cf-provider.ts` (TextProvider + VisionProvider factories)
Routing logic: `src/lib/ai/service.ts`
Model registry: `src/lib/ai/models.ts`
Dashboard toggle: users switch providers + edit system prompts from `/admin/settings`

---

## Development Rules

- **Edge runtime** — no `fs`, `path`, or Node.js builtins in server paths
- **Env access** — `import { env } from "cloudflare:workers"` (not `Astro.locals.runtime.env`)
- `nodejs_compat` flag enabled in wrangler.json
- Tailwind V4 — CSS-native config, `@theme` in `global.css`, utility-first
- Dark/light mode via `dark:` variant
- D1 queries use batched operations to stay within free-tier limits
- No heavy state managers (no Redux, no Zustand)
- No heavy frameworks — pure Astro, zero React

---

## Deploy

```bash
# Automated (first-time)
bash setup.sh     # creates D1, R2, deploys via wrangler

# Manual
npm run build     # astro build
npm run deploy    # build + wrangler deploy
```

GitHub Actions: auto-deploys on push to `main`.

---

## Database

13 tables: models, tags, entries, entry_tags, entry_images, pages, page_tags,
settings, blog_topics, blog_posts, blog_post_topics, ai_usage, _migrations.

Schema: `schema.sql`
Migrations: `migrations/0001_initial.sql` through `migrations/0009_prompt_params.sql`

---

## What NOT to Do

- Do NOT add production data, API keys, or personal content
- Do NOT install heavy dependencies (this ships on CF Workers free tier)
- Do NOT add in-app auth (Zero Trust handles it at infrastructure level)
- Do NOT run multiple dev servers or background processes
