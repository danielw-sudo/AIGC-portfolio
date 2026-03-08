# AIGC Portfolio — Roadmap

## Completed

### Core Platform
- [x] Gallery with masonry layout, search, tag/model filtering
- [x] Blog with markdown, topics, RSS feed
- [x] Admin panel (gallery, blog, pages, AI settings, site config, DB management)
- [x] AI integration (CF Workers AI + NVIDIA + Google), vision tagging
- [x] Dark/light theme with design system
- [x] SEO foundation (OG, canonical, sitemap, robots, JSON-LD)
- [x] Related entries ("You might also like")
- [x] Share buttons (clipboard API)
- [x] 404 and empty state personality copy
- [x] GitHub Actions auto-deploy on push to main

### Template Fork (Phase 4a)
- [x] Strip personal data, generalize hardcoded values
- [x] Environment variable driven (SITE_NAME, SITE_URL, SITE_AUTHOR, R2_PUBLIC_URL)
- [x] Clean wrangler.json with placeholder values
- [x] SETUP.md deployment guide

### Setup Automation (Phase 4b)
- [x] `setup.sh` CLI script: takes CF API token, creates D1 + R2 + deploys via wrangler
- [x] Reduces manual steps 2–6 of SETUP.md to one command
- [x] For users who have Node.js + wrangler installed locally

---

## Planned

### Phase 4c — Polish & Docs
- [x] Restructure root documentation into `src/QuickStart/`
- [x] Multilingual README split (EN, ZH, JA)
- [x] Agentic Handoff config (`.antigravity/rules.md`)
- [ ] Screenshot walkthrough for SETUP.md
- [ ] Admin quick-start guide improvements
- [ ] Contributing guide

### Phase 5 — Chatbot Setup Assistant (future)
- [ ] Web-based chatbot guiding users through fork → deploy flow
- [ ] Step-by-step CF dashboard instructions with context awareness
- [ ] Token creation guidance, error handling
- [ ] Requires: separate hosting, AI API costs, prompt engineering

### Ideas (unscheduled)
- [ ] Gallery public search page
- [ ] Blog card excerpts on home page
- [ ] Tag title case normalization
- [ ] Date format standardization (ISO vs locale)
- [ ] Hide zero-count models/tags from listings
- [ ] Logomark concept
- [ ] llms.txt for AI discoverability
- [ ] Image optimization pipeline (WebP conversion, thumbnails)
- [ ] Batch import/export (JSON or CSV)

---

## Release History

### v1.2.0 (2026-03-07) — Agentic Handoff & Docs Refactor
- Consolidated QuickStart docs (`DEPLOY_WITH_AI.md`, `SETUP.md`, `how-to-get-free-test-api.md`) into `src/QuickStart/`.
- Split monolithic `README.md` into `README.md` (EN), `README_ZH.md`, and `README_JA.md`.
- Added `.antigravity/rules.md` as a strict AI-to-AI system prompt handoff to ensure fast agent onboarding.

### v1.1.0 (2026-03-07) — Setup Automation
- Shipped `setup.sh`: Interactive bash script to automate D1/R2 creation, JSON config patching, schema migration, and deployment.
- Refactored `SETUP.md` to highlight "Quick Setup" vs. "Manual Setup".
- **Architecture Note:** Employs `node -e` for robust JSON manipulation and `printf -v` to prevent shell injection. Fast, idempotent deploys.

### v1.0.0 (2026-03-04) — Initial Template Release
- Full Astro 5 SSR app running on Cloudflare Workers edge.
- D1 Database for dynamic gallery/blog content; R2 for image storage; JSON files for static configuration.
- Multi-provider AI integration (CF Workers AI, NVIDIA NIM, Google Gemini) via prefix string routing (`@cf/`, `@nv/`, `@google/`).
- Zero Trust Admin Panel handles auth at the infrastructure level.
- Complete responsive design system (Tailwind CSS V4, Light/Dark mode).
- SEO optimized (JSON-LD, Canonical URLs, Sitemap).
