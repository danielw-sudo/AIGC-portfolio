# AIGC Portfolio — Development Log

## v1.1.0 — Setup Automation (2026-03-07)

### What shipped
- `setup.sh` — interactive bash script automating full deploy (D1 + R2 creation, config patching, schema migration, deploy)
- SETUP.md restructured: "Quick Setup" one-liner at top, manual steps moved under "Manual Setup"
- JSON patching via `node -e` with env vars (safe for special characters in site name/author)
- Idempotent: detects existing D1/R2 resources and skips creation

### Decisions
- **Bash over Node.js script** — wrangler CLI is the interface, script is glue; Node.js already a prerequisite
- **`node -e` over `sed`** — robust JSON manipulation, no regex edge cases
- **`printf -v` over `eval`** — avoids shell injection in prompt helper
- **Auto-deploy at end** — user gets a live site immediately after running setup.sh

### Notes
- CI fails on template repo (expected — `wrangler.json` has placeholder values)
- Users who fork + run `setup.sh` get real values and green builds

## v1.0.0 — Initial Template Release (2026-03-04)

### What shipped
- Full Astro 5 SSR app on Cloudflare Workers
- Gallery: entries with images, prompts, tags, models, masonry layout, lightbox, search
- Blog: posts with markdown body, topics, cover images, RSS feed
- Admin panel: full CRUD for gallery entries, blog posts, pages, site config
- AI integration: multi-provider (CF Workers AI, NVIDIA, Google), vision tagging, auto-fill suggestions
- Design system: dark/light theme toggle, glass effects, responsive layout
- SEO: OG tags, canonical URLs, sitemap, robots.txt, JSON-LD on entry detail
- Infrastructure: D1 database, R2 image storage, GitHub Actions CI/CD

### Architecture decisions
- **Astro 5 SSR** (`output: 'server'`) — required for D1 runtime bindings
- **No auth in app** — Cloudflare Zero Trust handles admin protection at the edge
- **AI is optional** — admin works fully without AI, graceful degradation on errors
- **Settings-driven** — hero, header, footer, meta descriptions all editable from admin
- **Multi-provider AI** — model prefix routing (`@cf/`, `@nv/`, `@google/`)

### Known limitations
- D1 free tier: 10ms CPU per invocation — queries are batched to stay under
- NVIDIA API: 40 RPM rate limit
- No user accounts — single-admin architecture by design
