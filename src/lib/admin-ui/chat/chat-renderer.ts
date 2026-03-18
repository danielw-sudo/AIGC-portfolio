/**
 * Butler chat DOM renderer — message bubbles, copy/edit actions, elapsed timer.
 * Append-only rendering with reset support for message editing.
 */
import type { ChatMessage } from './chat-engine';

let container: HTMLElement | null = null;
let renderedCount = 0;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let timerStart = 0;

const AVATAR = `<div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5"><span class="text-[10px] text-white font-bold">ai</span></div>`;

export function initRenderer(el: HTMLElement) { container = el; renderedCount = 0; }

/** Reset renderer state and clear container. Used for message editing. */
export function resetRenderer() {
  renderedCount = 0;
  if (container) container.innerHTML = '';
}

export interface RenderHandlers {
  onEdit?: (index: number, content: string) => void;
}

export function renderMessages(messages: ChatMessage[], handlers?: RenderHandlers) {
  if (!container) return;
  const pendingEl = container.querySelector('[data-pending]');

  if (pendingEl && !messages.some((m) => m.status === 'pending')) {
    pendingEl.remove();
    stopTimer();
    renderedCount = Math.min(renderedCount - 1, messages.length);
  }

  // If messages shrank (truncation from edit), reset and re-render all
  if (messages.length < renderedCount) { resetRenderer(); }

  for (let i = renderedCount; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.status === 'pending') { container.appendChild(createPendingEl()); startTimer(); }
    else { container.appendChild(createBubble(msg, i, handlers)); }
  }
  renderedCount = messages.length;
  scrollToBottom();
}

function createBubble(msg: ChatMessage, index: number, handlers?: RenderHandlers): HTMLElement {
  const div = document.createElement('div');

  if (msg.role === 'user') {
    div.className = 'flex gap-3 mb-4 justify-end group';
    const editSvg = `<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    div.innerHTML = `<div class="flex items-start gap-1.5"><button data-edit="${index}" class="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 p-1 transition-opacity shrink-0 mt-1" title="Edit">${editSvg}</button><div class="bg-blue-600 text-white rounded-lg p-3 max-w-[80%] text-sm">${esc(msg.content)}</div></div>`;
    const editBtn = div.querySelector('[data-edit]') as HTMLButtonElement;
    if (editBtn && handlers?.onEdit) {
      editBtn.addEventListener('click', () => handlers.onEdit!(index, msg.content));
    }
    return div;
  }

  // Assistant bubble
  div.className = 'flex gap-3 mb-4 group';
  const cls = msg.status === 'error'
    ? 'bg-red-900/30 border border-red-500/30 text-red-300'
    : 'bg-gray-900 text-gray-300';
  const copySvg = `<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const checkSvg = `<svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

  let inner = `${AVATAR}<div class="max-w-[85%] space-y-2">`;
  if (msg.content) {
    inner += `<div class="relative ${cls} rounded-lg p-3 text-sm">${formatContent(msg.content)}`;
    inner += `<button data-copy class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 p-1 transition-opacity" title="Copy">${copySvg}</button></div>`;
  }
  if (msg.elapsed) {
    const l = msg.elapsed > 1000 ? `${(msg.elapsed / 1000).toFixed(1)}s` : `${msg.elapsed}ms`;
    inner += `<span class="text-[10px] text-gray-600">${l}</span>`;
  }
  inner += '</div>';
  div.innerHTML = inner;

  // Wire copy button
  const copyBtn = div.querySelector('[data-copy]') as HTMLButtonElement | null;
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(msg.content);
      copyBtn.innerHTML = checkSvg;
      setTimeout(() => { copyBtn.innerHTML = copySvg; }, 1500);
    });
  }
  return div;
}

function createPendingEl(): HTMLElement {
  const div = document.createElement('div');
  div.setAttribute('data-pending', '');
  div.className = 'flex gap-3 mb-4';
  div.innerHTML = `${AVATAR}<div class="bg-gray-900 rounded-lg p-3 text-sm text-gray-500 flex items-center gap-2"><span class="flex gap-1"><span class="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style="animation-delay:0ms"></span><span class="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style="animation-delay:150ms"></span><span class="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style="animation-delay:300ms"></span></span><span data-elapsed class="text-[10px] text-gray-600">0s</span></div>`;
  return div;
}

function startTimer() {
  timerStart = Date.now();
  stopTimer();
  timerInterval = setInterval(() => {
    const el = container?.querySelector('[data-elapsed]');
    if (el) el.textContent = `${((Date.now() - timerStart) / 1000).toFixed(1)}s`;
  }, 100);
}

function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

function scrollToBottom() {
  if (!container) return;
  requestAnimationFrame(() => container!.scrollTo({ top: container!.scrollHeight, behavior: 'smooth' }));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatContent(s: string): string { return esc(s).replace(/\n/g, '<br>'); }
