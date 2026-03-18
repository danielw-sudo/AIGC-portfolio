/** Butler chat engine — message state, API caller, session persistence. */
import { saveHistory, loadHistory, clearHistory as clearStore } from './chat-storage';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  elapsed?: number;
  status?: 'pending' | 'done' | 'error';
}

export interface ChatResponse {
  reply: string;
  elapsed?: number;
  error?: string;
}

let messages: ChatMessage[] = [];
let selectedModel: string | null = null;
let onUpdate: ((msgs: ChatMessage[]) => void) | null = null;

export function initChat(opts: { onUpdate: (msgs: ChatMessage[]) => void }) {
  onUpdate = opts.onUpdate;
  selectedModel = null;
  const restored = loadHistory();
  messages = restored || [];
  if (messages.length) onUpdate(messages);
}

export function setChatModel(model: string | null) { selectedModel = model; }
export function getMessages(): ChatMessage[] { return messages; }

export function resetChat(): void {
  messages = [];
  clearStore();
  onUpdate?.(messages);
}

export function pushAssistant(msg: Omit<ChatMessage, 'role'>) {
  messages.push({ role: 'assistant', ...msg });
  saveHistory(messages);
  onUpdate?.(messages);
}

/** Truncate messages from index, re-render all. For user message editing. */
export function truncateFrom(index: number) {
  messages = messages.slice(0, index);
  saveHistory(messages);
  onUpdate?.(messages);
}

/** Send a message to the Butler API. */
export async function sendMessage(text: string): Promise<void> {
  messages.push({ role: 'user', content: text, status: 'done' });
  saveHistory(messages);
  onUpdate?.(messages);

  messages.push({ role: 'assistant', content: '', status: 'pending' });
  onUpdate?.(messages);

  try {
    const res = await callChat(text);
    messages.pop();
    pushAssistant({ content: res.reply, elapsed: res.elapsed });
  } catch (err) {
    messages.pop();
    const msg = err instanceof Error ? err.message : 'Something went wrong';
    console.error('[butler] sendMessage error:', err);
    pushAssistant({ content: msg, status: 'error' });
  }
}

async function callChat(message: string): Promise<ChatResponse> {
  const past = messages.filter((m) => m.status !== 'pending');
  const recent = past.slice(0, -1).slice(-6).map((m) => ({ role: m.role, content: m.content }));

  const payload: Record<string, unknown> = { action: 'chat', message, history: recent };
  if (selectedModel) payload.model = selectedModel;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual',
  });

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    window.location.reload();
    throw new Error('Session expired — refreshing.');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({ error: 'Chat request failed' }))) as { error?: string };
    throw new Error(data.error || `Chat failed (${res.status})`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as ChatResponse;
  } catch {
    throw new Error(`Invalid response: ${text.substring(0, 120)}`);
  }
}
