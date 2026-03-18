/**
 * Google AI (Gemini) client — REST API for vision and text models.
 * Models prefixed @google/ in catalog; prefix stripped for API calls.
 *
 * Uses generativelanguage.googleapis.com/v1beta endpoint.
 * Image input via inline_data (base64 + mime_type), not URLs.
 */

const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: { content: { parts: { text: string }[] } }[];
  error?: { message: string; code: number };
}

function stripPrefix(model: string): string {
  return model.startsWith('@google/') ? model.slice(8) : model;
}

function categorizeError(status: number, body: string): Error {
  if (status === 429) return new Error('Google AI rate limit exceeded');
  if (status === 504 || status === 408) return new Error('Google AI timed out');
  if (status === 403) return new Error('Google AI key invalid or quota exhausted');
  return new Error(`Google AI error ${status}: ${body.substring(0, 200)}`);
}

/** Text-only Gemini call — chat messages mapped to Gemini content format. */
export async function callGoogleText(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 2048,
): Promise<string> {
  const modelId = stripPrefix(model);
  const url = `${GOOGLE_API_URL}/${modelId}:generateContent?key=${apiKey}`;

  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw categorizeError(res.status, errBody);
  }

  const json = (await res.json()) as GeminiResponse;
  if (json.error) throw new Error(`Google AI: ${json.error.message}`);
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Fetch image and return { base64, mimeType } for Gemini inline_data. */
async function fetchImageBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error('Failed to fetch image for Google vision');
  const mimeType = resp.headers.get('content-type') || 'image/jpeg';
  const bytes = new Uint8Array(await resp.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { data: btoa(bin), mimeType };
}

export async function callGoogleVision(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userText: string,
  imageUrl: string,
  maxTokens = 800,
): Promise<string> {
  const { data, mimeType } = await fetchImageBase64(imageUrl);
  const modelId = stripPrefix(model);
  const url = `${GOOGLE_API_URL}/${modelId}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        role: 'user',
        parts: [
          { text: userText },
          { inline_data: { mime_type: mimeType, data } },
        ],
      }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw categorizeError(res.status, errBody);
  }

  const json = (await res.json()) as GeminiResponse;
  if (json.error) throw new Error(`Google AI: ${json.error.message}`);
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
