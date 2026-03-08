import type { APIContext } from 'astro';
import { SettingsService, AIUsageService } from '@/lib/data';
import { BlogTopicService } from '@/lib/data/blog';
import { parseBlogAIMarkdown } from '@/lib/ai/parsers';
import { DEFAULT_BLOG_RECIPE, isNvidiaModel } from '@/lib/ai/models';
import { DEFAULT_BLOG_COPYWRITE_RECIPE } from '@/lib/data/settings';
import { callNvidia } from '@/lib/ai/nvidia';

function provider(model: string): string {
  if (model.startsWith('@nv/')) return 'nvidia';
  if (model.startsWith('@google/')) return 'google';
  return 'cf';
}

const VALID_TIERS = ['fast', 'balanced', 'quality'];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function POST(context: APIContext) {
  const { env } = context.locals.runtime;

  if (!env.AI) {
    return new Response(JSON.stringify({ error: 'AI binding not configured' }), { status: 501, headers: JSON_HEADERS });
  }

  const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null;
  const draft = (body?.draft as string)?.trim();
  const tier = (body?.tier as string) || 'fast';
  const mode = (body?.mode as string) || 'format';

  if (!draft) {
    return new Response(JSON.stringify({ error: 'draft is required' }), { status: 400, headers: JSON_HEADERS });
  }
  if (!VALID_TIERS.includes(tier)) {
    return new Response(JSON.stringify({ error: `Invalid tier. Use: ${VALID_TIERS.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
  }

  const usage = new AIUsageService(env.DB);

  try {
    const settings = new SettingsService(env.DB);
    const all = await settings.getAll();

    const modelKey = `ai_model_${tier}` as const;
    const model = all[modelKey] || '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
    const recipeKey = mode === 'copywrite' ? 'ai_blog_copywrite_recipe' : 'ai_blog_recipe';
    const recipeDefault = mode === 'copywrite' ? DEFAULT_BLOG_COPYWRITE_RECIPE : DEFAULT_BLOG_RECIPE;
    const recipe = all[recipeKey] || recipeDefault;

    // Inject existing topics
    const topicSvc = new BlogTopicService(env.DB);
    const topics = await topicSvc.getAll();
    const topicList = topics.map((t) => t.title).join(', ');
    const systemPrompt = recipe.replace('{{TOPICS}}', topicList);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: mode === 'copywrite' ? `Improve this blog post:\n\n${draft}` : `Format this draft:\n\n${draft}` },
    ];

    const t0 = Date.now();
    let text: string;
    if (isNvidiaModel(model)) {
      if (!env.NVIDIA_API_KEY) throw new Error('NVIDIA API key not configured');
      text = await callNvidia(env.NVIDIA_API_KEY, model, messages, 2048);
    } else {
      const response = await env.AI.run(model as BaseAiTextGenerationModels, {
        messages,
        max_tokens: 2048,
      });
      text = typeof response === 'object' && 'response' in response
        ? (response as { response: string }).response
        : String(response);
    }
    usage.log(model, provider(model), `blog-${mode}`, 'ok', Date.now() - t0);

    const trimmed = text.trim();
    const markdown = trimmed.length > 10_000 ? trimmed.substring(0, 10_000) : trimmed;
    const parsed = parseBlogAIMarkdown(markdown);

    return new Response(
      JSON.stringify({ parsed, textModel: model, markdown }),
      { headers: JSON_HEADERS },
    );
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();

    let status = 500;
    let message = 'AI analysis failed. Try again or adjust your draft.';

    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('429')) {
      status = 429;
      message = 'AI is temporarily busy. Wait a moment and try again.';
    } else if (lower.includes('timeout') || lower.includes('timed out')) {
      status = 504;
      message = 'Request took too long. Try a shorter draft.';
    } else if (lower.includes('model') && lower.includes('not found')) {
      status = 400;
      message = 'Selected AI model is unavailable. Check settings.';
    }

    return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
  }
}
