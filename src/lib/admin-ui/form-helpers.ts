/**
 * Shared DOM helpers for admin form pages.
 * Used by: admin/new.astro, admin/[id].astro, admin/pages/new.astro, admin/pages/[id].astro
 */

/** Flash a success/error banner in the message element. */
export function showMessage(el: HTMLElement, text: string, isError: boolean) {
  el.textContent = text;
  el.className = `mb-4 px-4 py-2 rounded-lg text-sm ${
    isError ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
  }`;
}

/** Wire a drop zone + hidden file input to an upload handler. */
export function setupDropZone(dzId: string, fiId: string, handler: (f: File) => void) {
  const dz = document.getElementById(dzId)!;
  const fi = document.getElementById(fiId) as HTMLInputElement;
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('border-blue-500');
  });
  dz.addEventListener('dragleave', () => dz.classList.remove('border-blue-500'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('border-blue-500');
    const f = (e as DragEvent).dataTransfer?.files[0];
    if (f?.type.startsWith('image/')) handler(f);
  });
  fi.addEventListener('change', () => {
    if (fi.files?.[0]) handler(fi.files[0]);
  });
}

/** Wire two tab buttons to toggle their panels. */
export function setupTabs(aId: string, bId: string, pAId: string, pBId: string) {
  const act = 'px-4 py-1.5 text-sm rounded-t-lg font-medium bg-gray-800 text-white border border-gray-700 border-b-0';
  const inact = 'px-4 py-1.5 text-sm rounded-t-lg font-medium bg-gray-900 text-gray-400 border border-gray-700 border-b-0 hover:text-white transition-colors';
  document.getElementById(aId)!.addEventListener('click', () => {
    document.getElementById(aId)!.className = act;
    document.getElementById(bId)!.className = inact;
    document.getElementById(pAId)!.classList.remove('hidden');
    document.getElementById(pBId)!.classList.add('hidden');
  });
  document.getElementById(bId)!.addEventListener('click', () => {
    document.getElementById(bId)!.className = act;
    document.getElementById(aId)!.className = inact;
    document.getElementById(pBId)!.classList.remove('hidden');
    document.getElementById(pAId)!.classList.add('hidden');
  });
}

/** Wire N tab buttons to toggle their panels. First tab active by default. */
export function setupNTabs(tabs: { btnId: string; panelId: string }[]) {
  const act = 'px-4 py-1.5 text-sm rounded-t-lg font-medium bg-gray-800 text-white border border-gray-700 border-b-0';
  const inact = 'px-4 py-1.5 text-sm rounded-t-lg font-medium bg-gray-900 text-gray-400 border border-gray-700 border-b-0 hover:text-white transition-colors';
  tabs.forEach(({ btnId }, idx) => {
    document.getElementById(btnId)!.addEventListener('click', () => {
      tabs.forEach(({ btnId: bid, panelId: pid }, j) => {
        document.getElementById(bid)!.className = j === idx ? act : inact;
        document.getElementById(pid)!.classList.toggle('hidden', j !== idx);
      });
    });
  });
}

export interface ProgressHelper {
  show(text: string, pct: number): void;
  set(pct: number, text?: string, err?: boolean): void;
}

/** Create a progress bar controller for an upload/scrape operation. */
export function makeProg(barId: string, statusId: string, wrapId: string): ProgressHelper {
  return {
    show(text: string, pct: number) {
      document.getElementById(wrapId)!.classList.remove('hidden');
      document.getElementById(statusId)!.textContent = text;
      document.getElementById(statusId)!.classList.remove('text-red-400');
      document.getElementById(barId)!.style.width = pct + '%';
    },
    set(pct: number, text?: string, err = false) {
      document.getElementById(barId)!.style.width = pct + '%';
      if (text) {
        document.getElementById(statusId)!.textContent = text;
        if (err) document.getElementById(statusId)!.classList.add('text-red-400');
        else document.getElementById(statusId)!.classList.remove('text-red-400');
      }
    },
  };
}
