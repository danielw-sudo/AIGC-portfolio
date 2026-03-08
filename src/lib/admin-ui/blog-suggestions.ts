/**
 * Blog AI suggestion panel — per-field accept/reject UI for blog AI analysis.
 * Extracted from duplicated code in blog/new.astro and blog/[id].astro.
 */

export interface BlogSuggestionData {
  title?: string;
  summary?: string;
  body?: string;
  topics?: string[];
  newTopics?: string[];
}

export interface BlogSuggestionTargets {
  containerId: string;
  titleId: string;
  summaryId: string;
  bodyId: string;
  topicListId: string;
  onMessage: (text: string, isError: boolean) => void;
}

/** Render blog suggestion panel with per-field apply/reject. */
export function renderBlogSuggestions(
  data: BlogSuggestionData,
  model: string,
  targets: BlogSuggestionTargets,
) {
  const container = document.getElementById(targets.containerId)!;
  const modelShort = model.split('/').pop() || model;

  let html = `<div class="border border-accent/40 rounded-lg bg-surface-raised/50 p-4 space-y-3">`;
  html += `<div class="flex items-center justify-between">`;
  html += `<span class="text-xs text-accent font-semibold uppercase tracking-wider">AI Suggestions</span>`;
  html += `<div class="flex items-center gap-2">`;
  html += `<span class="text-[10px] text-text-muted">${esc(modelShort)}</span>`;
  html += `<button type="button" id="ai-dismiss" class="text-xs text-text-muted hover:text-text-primary">Dismiss</button>`;
  html += `</div></div>`;

  if (data.title) html += aiRow('title', 'Title', truncate(data.title, 60));
  if (data.summary) html += aiRow('summary', 'Summary', truncate(data.summary, 80));
  if (data.body) html += aiRow('body', 'Body', `${data.body.length} chars`);
  if (data.topics?.length) html += aiRow('topics', 'Topics', data.topics.join(', '));
  if (data.newTopics?.length) html += aiRow('newTopics', 'New topics', data.newTopics.join(', '));

  html += `</div>`;
  container.innerHTML = html;
  container.classList.remove('hidden');
  requestAnimationFrame(() => container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));

  // Wire dismiss
  document.getElementById('ai-dismiss')?.addEventListener('click', () => {
    container.innerHTML = '';
    container.classList.add('hidden');
  });

  // Wire accept/reject per field
  wireAI('title', () => setVal(targets.titleId, data.title!));
  wireAI('summary', () => setVal(targets.summaryId, data.summary!));
  wireAI('body', () => setVal(targets.bodyId, data.body!));
  wireAI('topics', () => applyTopics(data.topics || [], targets.topicListId));
  wireAI('newTopics', () => createTopics(data.newTopics || [], targets.topicListId));
}

// --- Internal helpers ---

function aiRow(id: string, label: string, preview: string): string {
  return `<div id="ai-row-${id}" class="flex items-start gap-2 group">
    <span class="text-xs text-text-muted w-20 shrink-0 pt-0.5">${label}</span>
    <p class="text-sm text-text-primary flex-1 truncate">${esc(preview)}</p>
    <button type="button" data-ai-accept="${id}" class="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/40 shrink-0">Apply</button>
    <button type="button" data-ai-reject="${id}" class="text-xs text-text-muted hover:text-red-400 shrink-0">✕</button>
  </div>`;
}

function wireAI(id: string, onAccept: () => void | Promise<void>) {
  document.querySelector(`[data-ai-accept="${id}"]`)?.addEventListener('click', async () => {
    await onAccept();
    const row = document.getElementById(`ai-row-${id}`);
    if (row) {
      const label = row.querySelector('span')?.textContent || '';
      row.innerHTML = `<span class="text-xs text-text-muted w-20 shrink-0">${label}</span><span class="text-xs text-green-400">✓ Applied</span>`;
    }
  });
  document.querySelector(`[data-ai-reject="${id}"]`)?.addEventListener('click', () => {
    document.getElementById(`ai-row-${id}`)?.remove();
  });
}

function setVal(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value;
}

function applyTopics(names: string[], listId: string) {
  const list = document.getElementById(listId)!;
  for (const name of names) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = list.querySelector(`[data-tag-slug="${slug}"] input`) as HTMLInputElement | null;
    if (existing) existing.checked = true;
  }
}

async function createTopics(names: string[], listId: string) {
  const list = document.getElementById(listId)!;
  for (const title of names) {
    try {
      const res = await fetch('/api/blog-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) continue;
      const topic = await res.json();
      const existing = list.querySelector(`input[name="topic_ids"][value="${topic.id}"]`) as HTMLInputElement | null;
      if (existing) { existing.checked = true; continue; }
      const label = document.createElement('label');
      label.className = 'inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-gray-700 cursor-pointer transition-colors';
      label.dataset.tagSlug = topic.slug;
      label.innerHTML = `<input type="checkbox" name="topic_ids" value="${topic.id}" class="accent-blue-500" checked /><span>${esc(topic.title)}</span>`;
      list.appendChild(label);
    } catch { /* skip */ }
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
