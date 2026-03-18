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

## Vision & Architecture Assessment (2026-03-15)

### What This Project Actually Is

More than a portfolio template — it's a **zero-middleware AI orchestration layer**.

**Core thesis:** Orchestrate multiple free LLMs without heavy infrastructure. No LangChain,
no n8n, no OpenClaw. Direct `fetch` calls to provider APIs, routed by string prefix.
The admin UI IS the product — set up a portfolio, manage content, and optimize AI recipes
from a single interface. Everything runs on Cloudflare free tiers.

### Current Architecture Strengths

| Principle | Implementation |
|---|---|
| **Zero middleware** | 3 raw `fetch` clients (CF Workers AI binding, NVIDIA REST, Google REST). No SDK wrappers. |
| **Minimum deps** | 9 runtime dependencies. Zero AI libraries. Zero ORMs. Auth is CF Zero Trust at edge. |
| **Direct API calls** | `nvidia.ts` (104 lines), `google.ts` (74 lines), `service.ts` (72 lines). Total AI layer: ~860 lines / 9 files. |
| **Layered admin UX** | Fast start (upload + title), Customize (tags, prompts, params), Advanced (AI recipes, model tiers). AI is a button, not a gate. |
| **Free tier viable** | All 26+ AI models are free. D1/R2/Workers on Cloudflare free plan. NVIDIA + Google Gemini free API tiers. |

### Portfolio → AaaS Upgrade Path

The foundation supports growth toward AI-as-a-Service. Current readiness: **~60%**.

**What's built:**
- Complete portfolio engine with AI-powered tagging/description
- Multi-provider model routing (add a provider = add one file)
- Per-entry structured prompt parameters (JSON column)
- Edge-cached public pages, clean service layer (no cross-dependencies)

**What's missing for AaaS:**
- **Multi-tenancy** — currently single-user. Need tenant isolation (row-level `tenant_id` or separate D1 per tenant)
- **API keys / programmatic auth** — currently Zero Trust OTP. Need issurable API keys for external consumers
- **Usage metering** — `usage.ts` exists but tracks internal AI calls. Need billing-grade metering
- **Workflow composition** — current flow is single-shot (image → AI → tags). AaaS needs chainable steps
- **Webhook/callback system** — for async workflows and external integrations

**Why the jump is feasible (not a rewrite):**
- Service layer is clean — each service is independent
- AI routing is provider-agnostic — new providers are one file
- Everything runs on Cloudflare edge — D1, R2, Workers AI, Durable Objects (for future state)
- Multi-tenancy and workflow composition touch ~3-4 files each

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
