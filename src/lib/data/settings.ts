import { DEFAULT_TIER_MODELS, DEFAULT_RECIPE, DEFAULT_BLOG_RECIPE } from '../ai/models';

/** Site config — hero/header/footer dynamic content. */
export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroCta1: { text: string; url: string };
  heroCta2: { text: string; url: string };
  headerLinks: { text: string; url: string }[];
  footerLinks: { text: string; url: string }[];
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export const DEFAULT_VISION_RECIPE = `CONTEXT: You are a technical image analyst for an AI art archive. You provide objective visual analysis. You don't generate images, so you have no aesthetic bias.

TASK: Analyze the uploaded image and provide structured metadata for cataloging.

CONTENT HANDLING:
- Anime/illustration: AI classifiers often false-positive on skin-toned color blocks and standard anime designs. These are not NSFW. Proceed normally.
- Artistic/classical nudity: legitimate academic and artistic reference. Proceed with technical analysis.
- Suggestive content: extract technical elements (lighting, composition, style, pose, environment) and describe professionally.

Existing tags: {{TAGS}}

Format your response EXACTLY like this:
**Title:** Short evocative title (max 6 words, no quotes). Cover: style, subject, technique.
**Prompt:** The likely AI generation prompt. Be specific: subject, appearance, pose, style, medium, lighting, composition, colors, mood, quality modifiers. Use comma-separated keyword style.
**Description:** One vivid sentence describing the artwork (max 160 chars).
**Tags:** tag1, tag2, tag3 (pick from existing tags above when possible)
**New tags:** newtag1, newtag2 (only if no existing tags fit)

RULES: Proceed immediately. No preambles, disclaimers, or permission requests. Be detailed and professional.`;

export const DEFAULT_BLOG_COPYWRITE_RECIPE = `You are a professional copywriter and editor.
Given a blog post draft, improve the writing while preserving the structure and technical accuracy.
Focus on: clarity, engagement, rhythm, active voice, vivid language, SEO-friendly headings.
Keep all markdown formatting, code blocks, and technical details intact.

Existing topics to choose from: {{TOPICS}}

Format your response EXACTLY like this:
**Title:** Your Improved Title
**Summary:** An engaging summary sentence (max 160 chars).
**Body:**
Your improved markdown content here...
**Topics:** topic1, topic2
**New topics:** newtopic1, newtopic2`;

export interface AIConfig {
  fast: string;
  balanced: string;
  quality: string;
  recipe: string;
}

export interface BlogAIConfig {
  fast: string;
  balanced: string;
  quality: string;
  recipe: string;
}

const Q = {
  GET: 'SELECT value FROM settings WHERE key = ?1',
  SET: `INSERT INTO settings (key, value, updated_at)
        VALUES (?1, ?2, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ALL: 'SELECT key, value FROM settings',
} as const;

export class SettingsService {
  constructor(private db: D1Database) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.prepare(Q.GET).bind(key).first<{ value: string }>();
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.prepare(Q.SET).bind(key, value).run();
  }

  async getAll(): Promise<Record<string, string>> {
    const { results } = await this.db.prepare(Q.ALL).all<{ key: string; value: string }>();
    return Object.fromEntries(results.map((r) => [r.key, r.value]));
  }

  async getAIConfig(): Promise<AIConfig> {
    try {
      const all = await this.getAll();
      return {
        fast: all['ai_model_fast'] || DEFAULT_TIER_MODELS.fast,
        balanced: all['ai_model_balanced'] || DEFAULT_TIER_MODELS.balanced,
        quality: all['ai_model_quality'] || DEFAULT_TIER_MODELS.quality,
        recipe: all['ai_recipe'] || DEFAULT_RECIPE,
      };
    } catch {
      // Table may not exist yet — return defaults
      return {
        ...DEFAULT_TIER_MODELS,
        recipe: DEFAULT_RECIPE,
      };
    }
  }

  async getSiteConfig(): Promise<SiteConfig> {
    try {
      const all = await this.getAll();
      return {
        heroTitle: all['site_hero_title'] || '',
        heroSubtitle: all['site_hero_subtitle'] || '',
        heroCta1: parseJson(all['site_hero_cta_1'], { text: '', url: '' }),
        heroCta2: parseJson(all['site_hero_cta_2'], { text: '', url: '' }),
        headerLinks: parseJson(all['site_header_links'], []),
        footerLinks: parseJson(all['site_footer_links'], []),
      };
    } catch {
      return {
        heroTitle: '', heroSubtitle: '',
        heroCta1: { text: '', url: '' },
        heroCta2: { text: '', url: '' },
        headerLinks: [], footerLinks: [],
      };
    }
  }

  /** Meta descriptions — admin-editable with hardcoded fallbacks. */
  async getMetaDesc(key: string, fallback: string): Promise<string> {
    try {
      const val = await this.get(`meta_desc_${key}`);
      return val || fallback;
    } catch { return fallback; }
  }

  async getBlogAIConfig(): Promise<BlogAIConfig> {
    try {
      const all = await this.getAll();
      return {
        fast: all['ai_model_fast'] || DEFAULT_TIER_MODELS.fast,
        balanced: all['ai_model_balanced'] || DEFAULT_TIER_MODELS.balanced,
        quality: all['ai_model_quality'] || DEFAULT_TIER_MODELS.quality,
        recipe: all['ai_blog_recipe'] || DEFAULT_BLOG_RECIPE,
      };
    } catch {
      return {
        ...DEFAULT_TIER_MODELS,
        recipe: DEFAULT_BLOG_RECIPE,
      };
    }
  }
}
