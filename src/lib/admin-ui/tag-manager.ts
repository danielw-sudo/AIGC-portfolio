/**
 * Tag creation + selection for admin forms.
 * Calls POST /api/tags to upsert, then checks/adds the tag in the tag list.
 */

export interface TagManagerOpts {
  inputId: string;
  btnId: string;
  listId: string;
  onMessage: (text: string, isError: boolean) => void;
}

/** Wire tag input + button. Creates tags via API, adds to checkbox list. */
export function initTagManager(opts: TagManagerOpts) {
  const input = document.getElementById(opts.inputId) as HTMLInputElement;
  const btn = document.getElementById(opts.btnId)!;
  const list = document.getElementById(opts.listId)!;

  async function handleAdd() {
    const title = input.value.trim();
    if (!title) return;
    btn.textContent = '...';
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const tag = await res.json();
      const existing = list.querySelector(
        `input[name="tag_ids"][value="${tag.id}"]`,
      ) as HTMLInputElement | null;
      if (existing) {
        existing.checked = true;
      } else {
        const label = document.createElement('label');
        label.className =
          'inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-gray-700 cursor-pointer transition-colors';
        label.dataset.tagSlug = tag.slug;
        label.innerHTML = `<input type="checkbox" name="tag_ids" value="${tag.id}" class="accent-blue-500" checked /><span>${tag.title}</span>`;
        list.appendChild(label);
      }
      input.value = '';
    } catch (err) {
      opts.onMessage((err as Error).message, true);
    } finally {
      btn.textContent = 'Add';
    }
  }

  btn.addEventListener('click', handleAdd);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });
}
