# AIGC Portfolio — Changelog

## State of the Project (Template Mode)

The AIGC Portfolio has reached its core feature-completeness. It serves as an exceptionally solid, zero-cost, and easily deployable open-source template. 

### Current Architecture Strengths

| Principle | Implementation |
|---|---|
| **Zero middleware** | 3 raw `fetch` clients (CF Workers AI binding, NVIDIA REST, Google REST). No SDK wrappers. |
| **Minimum deps** | 9 runtime dependencies. Zero AI libraries. Zero ORMs. Auth is CF Zero Trust at edge. |
| **Direct API calls** | `nvidia.ts` (104 lines), `google.ts` (74 lines), `service.ts` (72 lines). Total AI layer: ~860 lines / 9 files. |
| **Layered admin UX** | Fast start (upload + title), Customize (tags, prompts, params), Advanced (AI recipes, model tiers). AI is a button, not a gate. |
| **Free tier viable** | All 26+ AI models are free. D1/R2/Workers on Cloudflare free plan. NVIDIA + Google Gemini free API tiers. |

Since the core vision of a powerful, standalone AI portfolio is achieved, the focus of this codebase is now strictly on maintenance, bug fixes, and minor UI polish. Ambitious architectural shifts (like multi-tenancy or AaaS capabilities) will be intentionally reserved for entirely separate projects to keep this template pristine.

---

## Release History

### v1.4.0 (2026-03-18) — Astro 6, Demo Mode & Polish
- **Demo deployed** to `demo.tools4all.ai` via `wrangler.demo.json` (gitignored — contains account IDs)
- Demo D1 database seeded: 5 models, 8 tags, 8 gallery entries (all featured), 2 blog posts, 3 topics, 9 settings, guide page
- Demo-specific homepage hero: "Live Demo" badge, "Admin Demo" primary CTA, GitHub button — only renders when `DEMO_MODE=true`
- Default hero rebranded from artwhisper → AIGC Portfolio
- **Teal+beige palette** for demo differentiation: accent `#2bb5a0` (warm teal), light mode surface `#f4f0eb` (muted beige)
- Tailwind CSS upgraded to 4.2.2
- `wrangler.demo.json` added to `.gitignore`
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
- README rewrite: emotion-first positioning, trilingual (EN/ZH/JA) (`bda0ea5`)
- Setup docs split: 668-line SETUP.md → 3 language-specific files (SETUP-en/zh/ja.md)
- Real AI art samples replacing SVG placeholders (kittens, whale-ride, winter-village)
- Butler chat: system prompt now injects site context (site name, entry count, recent entries)
- Social preview image replaced with actual project card (`e1771ee`)
- GitHub topics added: serverless, cloudflare-workers, ai-art, zero-cost, astro-template, d1-database, multi-llm, r2-storage, ai-portfolio

### v1.3.0 (2026-03-17) — Feature Parity with Pilot
- Ported all features from private pilot project (artwhisper) to open-source template. `39d0644`
- **React removal**: Deleted `ThemeToggle.tsx`, replaced with pure Astro component. Removed `@astrojs/react`, `react`, `react-dom` deps.
- **Lucide icons**: Added `Icon.astro` (server-rendered SVGs via `lucide-static`) + `icons.ts` client-side helper.
- **AI module refactor**: Introduced `TextProvider`/`VisionProvider` type aliases. `cf-provider.ts` is now the single Cloudflare coupling point. `AIService` and `VisionService` constructors are provider-agnostic.
- **Chat Butler**: Full admin chat UI with multi-model picker, session persistence (sessionStorage), markdown export. 3 client modules (`chat-engine.ts`, `chat-renderer.ts`, `chat-storage.ts`) + API endpoint.
- **Site Audit**: 8 parallel D1 health queries + R2 orphan scan. Dry-run and delete modes for cleanup.
- **Developer Hub**: Tool cards linking to AI Settings, Site Config, DB Management, CF Analytics. AI usage monitor with per-model volume/latency bars.
- **UX polish**: Plus Jakarta Sans display font, `heroReveal` (letter-spacing animation), `blurFadeIn`, reusable `.animate-*` utilities. Welcome guide upgraded with Icon components.
- **Data hygiene**: Tag/topic normalize endpoints (`POST /api/tags/normalize`, `POST /api/blog-topics/normalize`). `toTitleCase` + `formatDate` utilities.
- **40 files changed**, 1521 insertions, 1341 deletions.

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
