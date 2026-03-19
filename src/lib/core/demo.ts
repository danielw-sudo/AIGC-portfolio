import { env } from 'cloudflare:workers';

const JSON_H = { 'Content-Type': 'application/json' };

/** Check if the instance is running in demo mode. */
export function isDemoMode(): boolean {
  return env.DEMO_MODE === 'true';
}

/** 403 response for blocked write operations. */
export function demoBlock(): Response {
  return new Response(
    JSON.stringify({ error: 'Demo mode — writes are disabled. Fork the repo to deploy your own!' }),
    { status: 403, headers: JSON_H },
  );
}

/** Mock Butler chat response. */
export function demoMockChat(): Response {
  return new Response(
    JSON.stringify({
      reply: `**[Demo Mode]** I'm Butler, the AI assistant for this portfolio site.\n\nIn a real deployment, I can:\n- Analyze your gallery content and suggest improvements\n- Help write blog posts with AI copywriting\n- Answer questions about your site's stats and health\n\nFork this repo and deploy to unlock live AI chat!`,
      elapsed: 42,
    }),
    { headers: JSON_H },
  );
}

/** Mock AI analyze response (gallery entries). */
export function demoMockAnalyze(): Response {
  return new Response(
    JSON.stringify({
      parsed: {
        tags: ['digital-art', 'abstract', 'vibrant'],
        title: '[Demo] Untitled Artwork',
        description: '[Demo] A vivid composition exploring color and form. In a real deployment, AI vision models analyze your actual image to generate tags, titles, and descriptions automatically.',
      },
      textModel: 'demo',
      markdown: '**Tags:** digital-art, abstract, vibrant\n**Title:** Untitled Artwork\n**Description:** A vivid composition exploring color and form.',
    }),
    { headers: JSON_H },
  );
}

/** Mock AI blog-analyze response. */
export function demoMockBlogAnalyze(): Response {
  return new Response(
    JSON.stringify({
      parsed: {
        headline: '[Demo] Your Blog Post Title',
        summary: '[Demo] AI-generated summary of your blog post. In a real deployment, the AI reads your draft and suggests headlines, summaries, and SEO metadata.',
        seoTitle: '[Demo] SEO-Optimized Title',
        seoDescription: '[Demo] A compelling meta description for search engines.',
      },
      textModel: 'demo',
      markdown: '**Headline:** Your Blog Post Title\n**Summary:** AI-generated summary.',
    }),
    { headers: JSON_H },
  );
}
