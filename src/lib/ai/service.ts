import { DEFAULT_TIER_MODELS, DEFAULT_RECIPE } from './models';
import { parseAIMarkdown, type ParsedAIResponse } from './parsers';
import type { ChatMessage, TextProvider } from './types';

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
  constructor(private provider: TextProvider) {}

  async analyze(
    prompt: string,
    existingTags: string[],
    tier: AIModelTier = 'fast',
    config: AIConfig = DEFAULT_AI_CONFIG,
  ): Promise<AnalyzeResult> {
    const model = config[tier];
    const tagList = existingTags.join(', ');
    const systemPrompt = config.recipe.replace('{{TAGS}}', tagList);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this prompt:\n\n${prompt}` },
    ];

    const text = await this.provider(model, messages, 256);
    const trimmed = text.trim();
    return { markdown: trimmed, model, parsed: parseAIMarkdown(trimmed) };
  }
}
