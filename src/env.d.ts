/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

// Augment Env with secrets and flags not in wrangler.json
interface Env {
  NVIDIA_API_KEY?: string;
  GOOGLE_AI_KEY?: string;
  DEMO_MODE?: string;
}
