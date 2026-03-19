import { env } from "cloudflare:workers";
import type { APIContext } from 'astro';
import { SettingsService, AIUsageService } from '@/lib/data';
import { createTextProvider } from '@/lib/ai/cf-provider';
import { DEFAULT_TIER_MODELS } from '@/lib/ai/models';
import type { ChatMessage } from '@/lib/ai/types';
import { BUTLER_DEFAULT_PROMPT } from '@/lib/ai/butler-prompt';
import { isDemoMode, demoMockChat } from '@/lib/core/demo';

const JSON_H = { 'Content-Type': 'application/json' };

function providerName(model: string): string {
  if (model.startsWith('@nv/')) return 'nvidia';
  if (model.startsWith('@google/')) return 'google';
  return 'cf';
}

async function getModel(settings: SettingsService, hasGoogle: boolean): Promise<string> {
  const custom = await settings.get('ai_model_chat');
  if (custom) return custom;
  return hasGoogle ? '@google/gemini-2.5-flash' : DEFAULT_TIER_MODELS.fast;
}

/** Gather live site stats for Butler context injection. */
async function buildSiteContext(db: D1Database, env: Record<string, unknown>): Promise<string> {
  try {
    const [entries, tags, posts, topics] = await Promise.all([
      db.prepare('SELECT COUNT(*) as c FROM entries WHERE status = ?1').bind('published').first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM tags').first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM blog_posts WHERE status = ?1').bind('published').first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM blog_topics').first<{ c: number }>(),
    ]);

    const providers: string[] = ['CF Workers AI (built-in)'];
    if (env.NVIDIA_API_KEY) providers.push('NVIDIA NIM');
    if (env.GOOGLE_AI_KEY) providers.push('Google Gemini');

    const lines = [
      `Gallery: ${entries?.c ?? 0} published entries`,
      `Tags: ${tags?.c ?? 0}`,
      `Blog: ${posts?.c ?? 0} published posts, ${topics?.c ?? 0} topics`,
      `AI providers available: ${providers.join(', ')}`,
    ];

    return lines.join('\n');
  } catch {
    return 'Site context unavailable (database may not be initialized yet)';
  }
}

export async function POST(ctx: APIContext) {
  if (isDemoMode()) return demoMockChat();
  if (!env.AI) {
    return new Response(JSON.stringify({ error: 'AI binding not configured' }), { status: 501, headers: JSON_H });
  }

  const body = await ctx.request.json().catch(() => null) as {
    message?: string; model?: string;
    history?: Array<{ role: string; content: string }>;
  } | null;
  if (!body?.message) {
    return new Response(JSON.stringify({ error: 'message required' }), { status: 400, headers: JSON_H });
  }

  const settings = new SettingsService(env.DB);
  const usage = new AIUsageService(env.DB);

  try {
    const model = body.model || await getModel(settings, !!env.GOOGLE_AI_KEY);
    const [rawPrompt, siteContext] = await Promise.all([
      settings.get('ai_butler_prompt'),
      buildSiteContext(env.DB, env as Record<string, unknown>),
    ]);

    const basePrompt = rawPrompt || BUTLER_DEFAULT_PROMPT;
    const systemPrompt = basePrompt.includes('{{SITE_CONTEXT}}')
      ? basePrompt.replace('{{SITE_CONTEXT}}', siteContext)
      : `${basePrompt}\n\nCurrent site state:\n${siteContext}`;

    const textProvider = createTextProvider(env.AI, env.NVIDIA_API_KEY, env.GOOGLE_AI_KEY);
    const t0 = Date.now();

    const msgs: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    if (body.history?.length) {
      for (const h of body.history.slice(-6)) {
        msgs.push({ role: h.role as 'user' | 'assistant', content: h.content });
      }
    }
    msgs.push({ role: 'user', content: body.message });

    const reply = await textProvider(model, msgs, 512);
    const elapsed = Date.now() - t0;
    usage.log(model, providerName(model), 'chat', 'ok', elapsed);
    return new Response(JSON.stringify({ reply: reply.trim(), elapsed }), { headers: JSON_H });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();
    let status = 500;
    let msg = raw || 'Something went wrong. Try again.';
    if (lower.includes('rate limit') || lower.includes('429')) { status = 429; msg = 'AI is busy — wait 30s.'; }
    else if (lower.includes('timeout')) { status = 504; msg = 'Request timed out.'; }
    return new Response(JSON.stringify({ error: msg }), { status, headers: JSON_H });
  }
}
