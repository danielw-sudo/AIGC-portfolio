/**
 * Google AI model catalog — models accessed via Gemini API.
 * All IDs prefixed with @google/ to distinguish from @cf/ and @nv/.
 */

import type { AIModelInfo } from './models';

export const GOOGLE_MODEL_CATALOG: AIModelInfo[] = [
  {
    id: '@google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Google)',
    provider: 'Google', params: '—', context: '1M',
    description: 'Fast multimodal. 10 RPM free. Vision + text, no content gate.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash',
  },
  {
    id: '@google/gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite (Google)',
    provider: 'Google', params: '—', context: '1M',
    description: 'Fastest, highest free quota (30 RPM / 1500 RPD). Lightweight vision.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.0-flash-lite',
  },
  {
    id: '@google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Google)',
    provider: 'Google', params: '—', context: '1M',
    description: 'Best quality. 5 RPM free. Strong reasoning + vision.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.5-pro',
  },
];
