export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  params: string;
  context: string;
  description: string;
  docsUrl: string;
}

import { NVIDIA_MODEL_CATALOG } from './nvidia-models';
import { GOOGLE_MODEL_CATALOG } from './google-models';

const CF_MODEL_CATALOG: AIModelInfo[] = [
  // --- Ultra-lightweight ---
  {
    id: '@cf/meta/llama-3.2-1b-instruct',
    name: 'Llama 3.2 1B',
    provider: 'Meta', params: '1B', context: '60K',
    description: 'Ultra-lightweight, cheapest option. Good for simple tasks.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.2-1b-instruct/',
  },
  {
    id: '@cf/meta/llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B',
    provider: 'Meta', params: '3B', context: '128K',
    description: 'Lightweight with large context. Great balance of cost and quality.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/',
  },
  // --- 8B class ---
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    name: 'Llama 3.1 8B FP8 Fast',
    provider: 'Meta', params: '8B', context: '128K',
    description: 'Fastest 8B inference. FP8 quantized, optimized for speed.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8-fast/',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fp8',
    name: 'Llama 3.1 8B FP8',
    provider: 'Meta', params: '8B', context: '128K',
    description: 'Balanced FP8 quantization. Better quality than fast variant.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'Meta', params: '8B', context: '8K',
    description: 'Full precision 8B. Best quality in the 8B class.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/',
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    name: 'Mistral 7B v0.1',
    provider: 'Mistral', params: '7B', context: '3K',
    description: 'General-purpose instruction-tuned model.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/mistral-7b-instruct-v0.1/',
  },
  // --- Vision-capable ---
  {
    id: '@cf/meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    provider: 'Meta', params: '11B', context: '128K',
    description: 'Vision-capable. Can analyze images directly.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/',
  },
  {
    id: '@cf/google/gemma-3-12b-it',
    name: 'Gemma 3 12B',
    provider: 'Google', params: '12B', context: '80K',
    description: 'Multimodal (text + images). 140+ languages.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/gemma-3-12b-it/',
  },
  // --- Mid-tier ---
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'Meta', params: '17B MoE', context: '131K',
    description: 'Mixture-of-experts, natively multimodal, function calling.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/',
  },
  {
    id: '@cf/openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'OpenAI', params: '20B', context: '128K',
    description: 'OpenAI open-weight model. Lower latency than larger variants.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/',
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1 24B',
    provider: 'Mistral', params: '24B', context: '128K',
    description: 'Vision understanding, long context, function calling.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/',
  },
  {
    id: '@cf/qwen/qwen3-30b-a3b-fp8',
    name: 'Qwen3 30B MoE FP8',
    provider: 'Qwen', params: '30B MoE', context: '32K',
    description: 'Mixture-of-experts, strong reasoning and instruction-following.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/',
  },
  // --- Large ---
  {
    id: '@cf/qwen/qwq-32b',
    name: 'QwQ 32B',
    provider: 'Qwen', params: '32B', context: '24K',
    description: 'Medium reasoning model. Competitive with o1-mini.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/qwq-32b/',
  },
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill 32B',
    provider: 'DeepSeek', params: '32B', context: '80K',
    description: 'Distilled reasoning model. Strong analytical capabilities.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/deepseek-r1-distill-qwen-32b/',
  },
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 70B FP8 Fast',
    provider: 'Meta', params: '70B', context: '24K',
    description: 'Largest Llama. Best quality, highest neuron cost.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/',
  },
  // --- Specialized ---
  {
    id: '@cf/zai-org/glm-4.7-flash',
    name: 'GLM 4.7 Flash',
    provider: 'ZAI', params: '—', context: '131K',
    description: 'Ultrafast multilingual, 100+ languages, function calling.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/',
  },
  {
    id: '@cf/ibm-granite/granite-4.0-h-micro',
    name: 'Granite 4.0 Micro',
    provider: 'IBM', params: 'Micro', context: '131K',
    description: 'Cheapest inference. Good for RAG and edge deployments.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/granite-4.0-h-micro/',
  },
  {
    id: '@cf/openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI', params: '120B', context: '128K',
    description: 'Largest available. Powerful reasoning, highest cost.',
    docsUrl: 'https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/',
  },
];

export const AI_MODEL_CATALOG: AIModelInfo[] = [
  ...CF_MODEL_CATALOG,
  ...NVIDIA_MODEL_CATALOG,
  ...GOOGLE_MODEL_CATALOG,
];

export function findModel(id: string): AIModelInfo | undefined {
  return AI_MODEL_CATALOG.find((m) => m.id === id);
}

export function isNvidiaModel(modelId: string): boolean {
  return modelId.startsWith('@nv/');
}

export function isGoogleModel(modelId: string): boolean {
  return modelId.startsWith('@google/');
}

export const DEFAULT_TIER_MODELS = {
  fast: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
  balanced: '@cf/meta/llama-3.1-8b-instruct-fp8',
  quality: '@cf/meta/llama-3.1-8b-instruct',
} as const;

export const DEFAULT_RECIPE = `You are an AI art curator assistant.
Given an image generation prompt, suggest:
1. A short, evocative title (max 6 words, no quotes)
   - Cover up to 3 of these elements: [style] [main subject/theme] [genre] [technique] [unique keyword]
   - Examples: "Baroque Gothic Queen Watercolor Battle", "Neon Cyberpunk Samurai Digital Glow", "Minimalist Ocean Sunset Ink"
2. A one-sentence description for the artwork
3. 3-5 relevant tags from this list: {{TAGS}}
4. If none of the existing tags fit, suggest 1-2 new tags

Format your response EXACTLY like this:
**Title:** Your Suggested Title
**Description:** A brief description of the artwork.
**Tags:** tag1, tag2, tag3
**New tags:** newtag1, newtag2

Be concise. No explanations beyond the format above.`;

export const DEFAULT_BLOG_RECIPE = `You are an AI writing assistant.
Given a raw text draft, format it into a structured blog post.

1. A concise, engaging title (max 10 words)
2. A 1-2 sentence summary for previews and SEO
3. The full body formatted as clean Markdown (headings, paragraphs, lists, code blocks as appropriate)
4. 2-4 relevant topics from this list: {{TOPICS}}
5. If none of the existing topics fit, suggest 1-2 new topics

Format your response EXACTLY like this:
**Title:** Your Blog Post Title
**Summary:** A brief summary sentence.
**Body:**
Your formatted markdown content here...
**Topics:** topic1, topic2
**New topics:** newtopic1, newtopic2`;
