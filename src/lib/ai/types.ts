/**
 * Shared types for the AI module — provider-agnostic.
 * No Cloudflare dependencies.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

/**
 * A function that sends messages to an LLM and returns the response text.
 * The caller is responsible for routing to the correct provider.
 */
export type TextProvider = (
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
) => Promise<string>;
