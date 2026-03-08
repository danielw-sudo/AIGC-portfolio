import type { TagRow } from '../core/types';
import { DEFAULT_TIER_MODELS, DEFAULT_RECIPE, isNvidiaModel } from './models';
import { parseAIMarkdown, type ParsedAIResponse } from './parsers';
import { callNvidia } from './nvidia';

export type AIModelTier = 'fast' | 'balanced' | 'quality';

export interface AIConfig {
  fast: string;
  balanced: string;
  quality: string;
  recipe: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  ...DEFAULT_TIER_MODELS,
  recipe: DEFAULT_RECIPE,
};

export interface AnalyzeResult {
  markdown: string;
  model: string;
  parsed: ParsedAIResponse;
}

export class AIService {
  constructor(
    private ai: Ai,
    private db: D1Database,
  ) {}

  async analyze(
    prompt: string,
    tier: AIModelTier = 'fast',
    config: AIConfig = DEFAULT_AI_CONFIG,
    nvidiaApiKey?: string,
  ): Promise<AnalyzeResult> {
    const model = config[tier];
    const tags = await this.getExistingTags();
    const tagList = tags.map((t) => t.title).join(', ');
    const systemPrompt = config.recipe.replace('{{TAGS}}', tagList);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Analyze this prompt:\n\n${prompt}` },
    ];

    let text: string;
    if (isNvidiaModel(model)) {
      if (!nvidiaApiKey) throw new Error('NVIDIA API key not configured');
      text = await callNvidia(nvidiaApiKey, model, messages, 256);
    } else {
      const response = await this.ai.run(model as BaseAiTextGenerationModels, {
        messages,
        max_tokens: 256,
      });
      text = typeof response === 'object' && 'response' in response
        ? (response as { response: string }).response
        : String(response);
    }

    const trimmed = text.trim();
    return { markdown: trimmed, model, parsed: parseAIMarkdown(trimmed) };
  }

  private async getExistingTags(): Promise<TagRow[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM tags ORDER BY title')
      .all<TagRow>();
    return results;
  }
}
