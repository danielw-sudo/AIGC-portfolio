/**
 * NVIDIA API model catalog — models accessed via integrate.api.nvidia.com.
 * All IDs prefixed with @nv/ to distinguish from @cf/ (Cloudflare Workers AI).
 */

import type { AIModelInfo } from './models';

export const NVIDIA_MODEL_CATALOG: AIModelInfo[] = [
  // --- Fast tier ---
  {
    id: '@nv/microsoft/phi-4-mini-instruct',
    name: 'Phi-4 Mini (NVIDIA)',
    provider: 'Microsoft', params: '3.8B', context: '16K',
    description: 'Ultra-fast small model via NVIDIA API. Good for chores.',
    docsUrl: 'https://build.nvidia.com/microsoft/phi-4-mini-instruct',
  },
  {
    id: '@nv/nvidia/nemotron-mini-4b-instruct',
    name: 'Nemotron Mini 4B (NVIDIA)',
    provider: 'NVIDIA', params: '4B', context: '8K',
    description: 'NVIDIA-native lightweight model. Fast inference.',
    docsUrl: 'https://build.nvidia.com/nvidia/nemotron-mini-4b-instruct',
  },
  // --- Balanced tier ---
  {
    id: '@nv/mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2 (NVIDIA)',
    provider: 'Mistral', params: '123B', context: '128K',
    description: 'Large Mistral via NVIDIA H100 clusters. Strong reasoning.',
    docsUrl: 'https://build.nvidia.com/mistralai/mistral-large-2-instruct',
  },
  {
    id: '@nv/nvidia/llama-3.1-nemoguard-8b',
    name: 'NemoGuard 8B (NVIDIA)',
    provider: 'NVIDIA', params: '8B', context: '8K',
    description: 'Safety-focused Llama variant. Balanced quality.',
    docsUrl: 'https://build.nvidia.com/nvidia/llama-3.1-nemoguard-8b',
  },
  // --- Quality tier ---
  {
    id: '@nv/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill 32B (NVIDIA)',
    provider: 'DeepSeek', params: '32B', context: '80K',
    description: 'Distilled reasoning via NVIDIA. Higher throughput.',
    docsUrl: 'https://build.nvidia.com/deepseek-ai/deepseek-r1-distill-qwen-32b',
  },
  {
    id: '@nv/meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B (NVIDIA)',
    provider: 'Meta', params: '405B', context: '128K',
    description: 'Largest open model. Maximum quality via NVIDIA.',
    docsUrl: 'https://build.nvidia.com/meta/llama-3.1-405b-instruct',
  },
  // --- Vision tier ---
  {
    id: '@nv/meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision (NVIDIA)',
    provider: 'Meta', params: '90B', context: '128K',
    description: 'Large vision model (90B). Far more capable than CF 11B.',
    docsUrl: 'https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct',
  },
  {
    id: '@nv/nvidia/vila',
    name: 'VILA (NVIDIA)',
    provider: 'NVIDIA', params: '—', context: '—',
    description: 'NVIDIA-native vision-language model.',
    docsUrl: 'https://build.nvidia.com/nvidia/vila',
  },
];
