/**
 * NVIDIA API client — OpenAI-compatible endpoint for text and vision models.
 * Models are prefixed @nv/ in the catalog; prefix is stripped for API calls.
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | NvidiaContentPart[];
}

export interface NvidiaContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface NvidiaResponse {
  choices: { message: { content: string } }[];
}

function stripPrefix(model: string): string {
  return model.startsWith('@nv/') ? model.slice(4) : model;
}

function categorizeError(status: number, body: string): Error {
  if (status === 429) return new Error('rate limit exceeded');
  if (status === 504 || status === 408) return new Error('timed out');
  if (status === 400 && body.toLowerCase().includes('model'))
    return new Error('model not found or unavailable');
  return new Error(`NVIDIA API error ${status}: ${body.substring(0, 200)}`);
}

export async function callNvidia(
  apiKey: string,
  model: string,
  messages: NvidiaMessage[],
  maxTokens = 256,
): Promise<string> {
  const res = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: stripPrefix(model),
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw categorizeError(res.status, errBody);
  }

  const data = (await res.json()) as NvidiaResponse;
  return data.choices?.[0]?.message?.content ?? '';
}

export async function callNvidiaVision(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userText: string,
  imageUrl: string,
  maxTokens = 128,
): Promise<string> {
  const messages: NvidiaMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];

  const res = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: stripPrefix(model),
      messages,
      max_tokens: maxTokens,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw categorizeError(res.status, errBody);
  }

  const data = (await res.json()) as NvidiaResponse;
  return data.choices?.[0]?.message?.content ?? '';
}
