import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { SettingsService, AIUsageService, TaxonomyService } from '@/lib/data';
import { AIService, type AIModelTier } from '@/lib/ai/service';
import { VisionService } from '@/lib/ai/vision';
import { parseAIMarkdown } from '@/lib/ai/parsers';
import { createTextProvider, createCfVisionProvider } from '@/lib/ai/cf-provider';

const VALID_TIERS = ['fast', 'balanced', 'quality'];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function fetchTagNames(db: D1Database): Promise<string[]> {
  const taxonomy = new TaxonomyService(db);
  const tags = await taxonomy.getAllTags();
  return tags.map((t) => t.title);
}

function provider(model: string): string {
  if (model.startsWith('@nv/')) return 'nvidia';
  if (model.startsWith('@google/')) return 'google';
  return 'cf';
}

export async function POST(context: APIContext) {

  if (!env.AI) {
    return new Response(
      JSON.stringify({ error: 'AI binding not configured' }),
      { status: 501, headers: JSON_HEADERS },
    );
  }

  const usage = new AIUsageService(env.DB);
  const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
  const mode = (body?.mode as string) || 'analyze';
  const prompt = (body?.prompt as string)?.trim();
  const tier = (body?.tier as string) || 'fast';
  const imageUrl = (body?.imageUrl as string)?.trim() || null;

  const vision = new VisionService(createCfVisionProvider(env.AI), {
    nvidia: env.NVIDIA_API_KEY,
    google: env.GOOGLE_AI_KEY,
  });

  // --- Vision Prompt Recovery ---
  if (mode === 'vision-prompt') {
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl required for prompt recovery' }), { status: 400, headers: JSON_HEADERS });
    }
    const t0 = Date.now();
    try {
      const settings = new SettingsService(env.DB);
      const visionModelId = (await settings.get('ai_model_vision')) || undefined;
      const recipe = (await settings.get('ai_vision_recipe')) || undefined;
      const tagNames = await fetchTagNames(env.DB);
      const result = await vision.recoverPrompt(imageUrl, tagNames, recipe, visionModelId);
      usage.log(result.model, provider(result.model), 'vision-prompt', 'ok', Date.now() - t0);
      const parsed = parseAIMarkdown(result.prompt);
      return new Response(JSON.stringify({
        recoveredPrompt: parsed.prompt,
        title: parsed.title,
        description: parsed.description,
        tags: parsed.tags,
        newTags: parsed.newTags,
        visionModel: result.model,
        raw: result.prompt,
      }), { headers: JSON_HEADERS });
    } catch (err) {
      usage.log('unknown', 'unknown', 'vision-prompt', 'error', Date.now() - t0);
      const msg = err instanceof Error ? err.message : 'Vision prompt recovery failed';
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers: JSON_HEADERS });
    }
  }

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: 'prompt is required' }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  if (!VALID_TIERS.includes(tier)) {
    return new Response(
      JSON.stringify({ error: `Invalid tier. Use: ${VALID_TIERS.join(', ')}` }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  try {
    const settings = new SettingsService(env.DB);
    const config = await settings.getAIConfig();

    // Text analysis
    const t0 = Date.now();
    const tagNames = await fetchTagNames(env.DB);
    const textProvider = createTextProvider(env.AI, env.NVIDIA_API_KEY, env.GOOGLE_AI_KEY);
    const ai = new AIService(textProvider);
    const raw = await ai.analyze(prompt, tagNames, tier as AIModelTier, config);
    usage.log(raw.model, provider(raw.model), 'text', 'ok', Date.now() - t0);
    const result = raw.markdown.length > 5000
      ? { ...raw, markdown: raw.markdown.substring(0, 5000) }
      : raw;

    // Vision analysis (non-fatal)
    let visionTags: string[] | undefined;
    let visionModel: string | undefined;
    let visionError: string | undefined;

    if (imageUrl) {
      const tv = Date.now();
      try {
        const visionModelId = (await settings.get('ai_model_vision')) || undefined;
        const vr = await vision.analyzeImage(imageUrl, tagNames, visionModelId);
        visionTags = vr.tags;
        visionModel = vr.model;
        usage.log(vr.model, provider(vr.model), 'vision-tags', 'ok', Date.now() - tv);
      } catch (err) {
        visionError = err instanceof Error ? err.message : 'Vision analysis failed';
        usage.log('unknown', 'unknown', 'vision-tags', 'error', Date.now() - tv);
      }
    }

    return new Response(
      JSON.stringify({
        parsed: result.parsed,
        textModel: result.model,
        markdown: result.markdown,
        visionTags,
        visionModel,
        visionError,
      }),
      { headers: JSON_HEADERS },
    );
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();

    let status = 500;
    let message = 'AI analysis failed. Try again or adjust your prompt.';

    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('429')) {
      status = 429;
      message = 'AI is temporarily busy. Wait a moment and try again.';
    } else if (lower.includes('timeout') || lower.includes('timed out')) {
      status = 504;
      message = 'Request took too long. Try a shorter prompt.';
    } else if (lower.includes('model') && lower.includes('not found')) {
      status = 400;
      message = 'Selected AI model is unavailable. Check settings.';
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: JSON_HEADERS },
    );
  }
}
