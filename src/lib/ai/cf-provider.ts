/**
 * Cloudflare Workers AI provider — bridges the CF runtime binding
 * to the provider-agnostic TextProvider / VisionProvider interfaces.
 *
 * This file is the ONLY Cloudflare-coupled code in the ai module.
 * When extracting ai/ as a standalone package, this file stays behind.
 */

import { isNvidiaModel, isGoogleModel } from './models';
import { callNvidia } from './nvidia';
import { callGoogleText } from './google';
import type { TextProvider, ChatMessage } from './types';
import type { VisionProvider } from './vision';

/** Create a TextProvider that routes @nv/ → NVIDIA, @google/ → Gemini, else → CF Workers AI. */
export function createTextProvider(ai: Ai, nvidiaApiKey?: string, googleApiKey?: string): TextProvider {
  return async (model: string, messages: ChatMessage[], maxTokens: number): Promise<string> => {
    if (isNvidiaModel(model)) {
      if (!nvidiaApiKey) throw new Error('NVIDIA API key not configured');
      return callNvidia(nvidiaApiKey, model, messages, maxTokens);
    }
    if (isGoogleModel(model)) {
      if (!googleApiKey) throw new Error('Google AI key not configured');
      return callGoogleText(googleApiKey, model, messages, maxTokens);
    }
    // CF Workers AI
    const response = await ai.run(model as BaseAiTextGenerationModels, {
      messages,
      max_tokens: maxTokens,
    });
    return typeof response === 'object' && 'response' in response
      ? (response as { response: string }).response
      : String(response);
  };
}

/** Convert image URL to base64 data URI for CF Workers AI. */
async function toDataUri(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error('Failed to fetch image for vision analysis');
  const ct = resp.headers.get('content-type') || 'image/jpeg';
  const bytes = new Uint8Array(await resp.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:${ct};base64,${btoa(bin)}`;
}

/** Create a VisionProvider backed by CF Workers AI (multimodal). */
export function createCfVisionProvider(ai: Ai): VisionProvider {
  return async (model, system, user, imageUrl, maxTokens) => {
    const dataUri = await toDataUri(imageUrl);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const response = await ai.run(model as BaseAiTextGenerationModels, {
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
  };
}
