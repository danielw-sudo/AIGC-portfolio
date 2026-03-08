<system_handoff target="agentic_ide_gemini">
[CONTEXT]
REPO: AIGC-portfolio.
WHY: Provide non-technical creators a zero-cost, instantly deployable, serverless AI art gallery and blog. Architecture favors extreme lightweight deployment ("Clean Slate") coupled to Cloudflare free-tier ecosystems. 
PHILOSOPHY: Zero built-in auth (relies on CF Zero Trust). Zero heavy state managers (no Redux). Zero heavy frameworks (no React/Vue; use Astro 5 + vanilla JS islands). 

[GOAL]
WHAT: A production-ready, edge-rendered (SSR) portfolio powered by multi-provider AI (CF Workers AI, NVIDIA NIM, Google Gemini) for auto-tagging and image descriptions. 
END-STATE: Ensure any feature addition maintains compatibility with `setup.sh` zero-click deployment and stays within Cloudflare D1/Workers free-tier execution limits (e.g., batched queries).

[HOW TO DEV]
ENVIRONMENT_STATE: The project is currently configured for the Cloudflare Workers edge runtime.
COMPATIBILITY_NOTE: Because it targets the edge, the current Astro implementation (`output: 'server'`) relies on web standard APIs and Cloudflare's `nodejs_compat` flag. Standard Node.js built-ins (`fs`, `path`) are currently avoided in the server paths.
DATA_STRUCTURE_STATE: 
- Dynamic data (Gallery Entries, Blog Posts) is currently mapped to a Cloudflare D1 Database (`schema.sql`).
- Static/Config data (site branding, AI model lists) is currently read from local JSON files (`src/data/*.json`).
STYLING_STATE: The UI is currently built with Tailwind CSS V4, using CSS-native configuration in `src/styles/global.css` (via `@theme`). Utility classes are used heavily over custom CSS. Both `dark:` and light modes are established.
AI_ROUTING_STATE: The codebase currently routes to different AI providers via string prefixes (e.g., `@cf/` = Workers AI, `@nv/` = NVIDIA, `@google/` = Gemini) as defined in `src/utils/ai.ts`.
AUTH_STATE: There is currently no in-app authentication middleware. The `/admin` routes rely entirely on Cloudflare Zero Trust Access at the infrastructure level.
</system_handoff>
