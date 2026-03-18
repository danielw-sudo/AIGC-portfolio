/**
 * Chat session persistence + markdown export.
 * sessionStorage: survives refresh, clears on tab close. Caps at 100 messages.
 */

import type { ChatMessage } from './chat-engine';

const KEY = 'aigc-chat-history';
const MAX_MESSAGES = 100;

interface StoredHistory {
  version: 1;
  messages: ChatMessage[];
  timestamp: number;
}

/** Save chat messages to sessionStorage. Filters out pending messages. */
export function saveHistory(messages: ChatMessage[]): void {
  const clean = messages.filter((m) => m.status !== 'pending');
  const trimmed = clean.length > MAX_MESSAGES ? clean.slice(-MAX_MESSAGES) : clean;
  const data: StoredHistory = { version: 1, messages: trimmed, timestamp: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full — silently fail
  }
}

/** Load chat messages from sessionStorage. Returns null if empty or corrupt. */
export function loadHistory(): ChatMessage[] | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredHistory;
    if (data.version !== 1 || !Array.isArray(data.messages)) return null;
    return data.messages.length ? data.messages : null;
  } catch {
    return null;
  }
}

/** Clear chat history from sessionStorage. */
export function clearHistory(): void {
  sessionStorage.removeItem(KEY);
}

/** Export messages as markdown string. */
export function exportAsMarkdown(messages: ChatMessage[]): string {
  const date = new Date().toISOString().split('T')[0];
  let md = `# AIGC Portfolio Chat — ${date}\n\n`;

  for (const msg of messages) {
    if (msg.status === 'pending') continue;
    const speaker = msg.role === 'user' ? '**You**' : '**AI Butler**';
    md += `${speaker}: ${msg.content}\n\n`;
  }
  return md.trimEnd() + '\n';
}
