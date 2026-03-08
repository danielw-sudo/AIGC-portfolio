/**
 * Vision analysis service — sends an image to a vision-capable model
 * and returns suggested metadata based on visual content.
 *
 * Provider priority: Google Gemini > NVIDIA > CF Workers AI.
 * Auto-replaces broken CF vision models with best available.
 */

import type { TagRow } from '../core/types';
import { isNvidiaModel, isGoogleModel } from './models';
import { callNvidiaVision } from './nvidia';
import { callGoogleVision } from './google';
import { DEFAULT_VISION_RECIPE } from '../data/settings';

export interface VisionResult {
  tags: string[];
  model: string;
}

export interface PromptResult {
  prompt: string;
  model: string;
}

export interface VisionKeys {
  nvidia?: string;
  google?: string;
}

const DEFAULT_VISION_GOOGLE = '@google/gemini-2.5-flash';
const DEFAULT_VISION_NV = '@nv/meta/llama-3.2-90b-vision-instruct';
const DEFAULT_VISION_CF = '@cf/meta/llama-4-scout-17b-16e-instruct';

/** CF models that are broken for vision — auto-replaced by resolveModel. */
const BROKEN_CF_VISION = new Set([
  '@cf/meta/llama-3.2-11b-vision-instruct',  // EU license gate
  '@cf/google/gemma-3-12b-it',               // no image_url schema on CF
]);

const TAG_PROMPT = `You are an art tag classifier.
Given an image, suggest 3-5 descriptive tags for categorizing this artwork.
Pick from these existing tags when possible: {{TAGS}}
If none fit, suggest new ones.
Return ONLY a comma-separated list of tags, nothing else.`;

export class VisionService {
  constructor(
    private ai: Ai,
    private db: D1Database,
    private keys: VisionKeys = {},
  ) {}

  /**
   * Resolve vision model — pick the best available provider.
   * Explicitly chosen Google/NVIDIA models are respected.
   * Any CF model is auto-upgraded when better providers are available
   * (CF vision has been unreliable — EU blocks, schema mismatches).
   */
  private resolveModel(configured?: string): string {
    // Explicitly chosen external provider → use it
    if (configured && (isGoogleModel(configured) || isNvidiaModel(configured))) {
      return configured;
    }
    // No config, broken CF, or any CF model → best available
    if (this.keys.google) return DEFAULT_VISION_GOOGLE;
    if (this.keys.nvidia) return DEFAULT_VISION_NV;
    return configured || DEFAULT_VISION_CF;
  }

  /** Convert image URL to base64 data URI for CF Workers AI. */
  private async toDataUri(imageUrl: string): Promise<string> {
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error('Failed to fetch image for vision analysis');
    const ct = resp.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(await resp.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:${ct};base64,${btoa(bin)}`;
  }

  /** Run a CF Workers AI multimodal call (Llama 4 Scout, etc.). */
  private async runCfVision(
    model: string, system: string, user: string, imageUrl: string, maxTokens: number,
  ): Promise<string> {
    const dataUri = await this.toDataUri(imageUrl);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const response = await this.ai.run(model as BaseAiTextGenerationModels, {
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: user },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      max_tokens: maxTokens,
    } as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return typeof response === 'object' && 'response' in response
      ? (response as { response: string }).response
      : String(response);
  }

  /** Route a vision call to the correct provider. */
  private async callVision(
    model: string, system: string, user: string, imageUrl: string, maxTokens: number,
  ): Promise<string> {
    if (isGoogleModel(model)) {
      if (!this.keys.google) throw new Error('Google AI key not configured');
      return callGoogleVision(this.keys.google, model, system, user, imageUrl, maxTokens);
    }
    if (isNvidiaModel(model)) {
      if (!this.keys.nvidia) throw new Error('NVIDIA API key not configured');
      return callNvidiaVision(this.keys.nvidia, model, system, user, imageUrl, maxTokens);
    }
    return this.runCfVision(model, system, user, imageUrl, maxTokens);
  }

  async analyzeImage(
    imageUrl: string, visionModel?: string,
  ): Promise<VisionResult> {
    const model = this.resolveModel(visionModel);
    const tags = await this.getExistingTags();
    const tagList = tags.map((t) => t.title).join(', ');
    const systemPrompt = TAG_PROMPT.replace('{{TAGS}}', tagList);

    const text = await this.callVision(
      model, systemPrompt, 'Analyze this image and suggest tags.', imageUrl, 128,
    );

    const IGNORE = new Set(['none', 'null', 'n/a', 'na', 'undefined', 'nothing', '-']);
    const parsed = text
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9 -]/g, ''))
      .filter((t) => t && !IGNORE.has(t))
      .map((t) => t.substring(0, 50))
      .slice(0, 10);

    return { tags: parsed, model };
  }

  /** Analyze an image and return structured metadata. */
  async recoverPrompt(
    imageUrl: string, recipe?: string, visionModel?: string,
  ): Promise<PromptResult> {
    const model = this.resolveModel(visionModel);
    const baseRecipe = recipe || DEFAULT_VISION_RECIPE;
    const tags = await this.getExistingTags();
    const tagList = tags.map((t) => t.title).join(', ');
    const systemPrompt = baseRecipe.replace('{{TAGS}}', tagList || 'none yet');

    const text = await this.callVision(
      model, systemPrompt, 'Analyze this image now.', imageUrl, 800,
    );

    return { prompt: text.trim(), model };
  }

  private async getExistingTags(): Promise<TagRow[]> {
    const { results } = await this.db.prepare('SELECT * FROM tags ORDER BY title').all<TagRow>();
    return results;
  }
}
