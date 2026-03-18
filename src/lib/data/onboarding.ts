/** Onboarding checklist state — detects completion of first-run steps. */

const SEED_HERO_TITLE = 'your<span class="text-accent">gallery</span>';

export interface OnboardingState {
  dismissed: boolean;
  sitePersonalized: boolean;
  hasRealEntry: boolean;
  hasUsedAI: boolean;
  hasRealBlogPost: boolean;
  hasSampleContent: boolean;
}

const Q = {
  SETTING: 'SELECT value FROM settings WHERE key = ?1',
  REAL_ENTRIES: `SELECT COUNT(*) as c FROM entries WHERE source_type != 'sample'`,
  AI_USAGE: `SELECT COUNT(*) as c FROM ai_usage_log LIMIT 1`,
  REAL_POSTS: `SELECT COUNT(*) as c FROM blog_posts WHERE slug != 'welcome-to-your-gallery'`,
  SAMPLE_COUNT: `SELECT COUNT(*) as c FROM entries WHERE source_type = 'sample'`,
} as const;

export async function getOnboardingState(db: D1Database): Promise<OnboardingState> {
  try {
    const [dismissedRow, heroRow, realEntries, aiUsage, realPosts, samples] = await Promise.all([
      db.prepare(Q.SETTING).bind('onboarding_dismissed').first<{ value: string }>(),
      db.prepare(Q.SETTING).bind('site_hero_title').first<{ value: string }>(),
      db.prepare(Q.REAL_ENTRIES).first<{ c: number }>(),
      db.prepare(Q.AI_USAGE).first<{ c: number }>().catch(() => ({ c: 0 })),
      db.prepare(Q.REAL_POSTS).first<{ c: number }>(),
      db.prepare(Q.SAMPLE_COUNT).first<{ c: number }>(),
    ]);

    return {
      dismissed: dismissedRow?.value === 'true',
      sitePersonalized: !!heroRow?.value && heroRow.value !== SEED_HERO_TITLE,
      hasRealEntry: (realEntries?.c ?? 0) > 0,
      hasUsedAI: (aiUsage?.c ?? 0) > 0,
      hasRealBlogPost: (realPosts?.c ?? 0) > 0,
      hasSampleContent: (samples?.c ?? 0) > 0,
    };
  } catch {
    return { dismissed: true, sitePersonalized: false, hasRealEntry: false, hasUsedAI: false, hasRealBlogPost: false, hasSampleContent: false };
  }
}
