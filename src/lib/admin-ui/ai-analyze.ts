/**
 * AI analyze button handler for admin entry forms.
 * Calls POST /api/analyze with prompt + tier + optional imageUrl,
 * then renders the suggestion UI for per-field accept/reject.
 */

import { renderSuggestions, getAIAssisted, type AISuggestionData } from './ai-suggestions';

export { getAIAssisted } from './ai-suggestions';

export interface AIAnalyzeOpts {
  btnId: string;
  tierId: string;
  promptId: string;
  descriptionId: string;
  titleId: string;
  tagListId: string;
  suggestionsId: string;
  imageUrlId?: string; // ID of hidden input or element with data-image-url
  onMessage: (text: string, isError: boolean) => void;
}

/** Wire the Analyze button to call Workers AI and render suggestions. */
export function initAIAnalyze(opts: AIAnalyzeOpts) {
  const btn = document.getElementById(opts.btnId) as HTMLButtonElement;
  const tier = document.getElementById(opts.tierId) as HTMLSelectElement;
  const promptEl = document.getElementById(opts.promptId) as HTMLTextAreaElement;

  btn.addEventListener('click', async () => {
    const prompt = promptEl.value.trim();
    if (!prompt) {
      opts.onMessage('Enter a prompt first — AI needs text to analyze.', true);
      return;
    }

    // Get image URL dynamically (may have changed since page load)
    let imageUrl: string | null = null;
    if (opts.imageUrlId) {
      const el = document.getElementById(opts.imageUrlId);
      imageUrl = (el as HTMLInputElement)?.value || el?.dataset.imageUrl || null;
    }

    btn.disabled = true;
    btn.textContent = 'Analyzing…';
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tier: tier.value, imageUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Analysis failed. Try again.');
      }

      const data = await res.json() as AISuggestionData & { parsed: AISuggestionData; textModel: string; markdown: string };

      // Check if we got any parsed fields
      const p = data.parsed || data;
      const hasParsed = p.title || p.description || p.tags?.length || p.newTags?.length;

      if (hasParsed) {
        renderSuggestions(
          {
            title: p.title,
            description: p.description,
            tags: p.tags || [],
            newTags: p.newTags || [],
            textModel: data.textModel || '',
            visionTags: data.visionTags,
            visionModel: data.visionModel,
            visionError: data.visionError,
          },
          {
            containerId: opts.suggestionsId,
            titleId: opts.titleId,
            descriptionId: opts.descriptionId,
            tagListId: opts.tagListId,
            onMessage: opts.onMessage,
          },
        );
        opts.onMessage('AI suggestions ready — review and apply.', false);
      } else {
        // Fallback: dump raw markdown into description (old behavior)
        const descEl = document.getElementById(opts.descriptionId) as HTMLTextAreaElement;
        descEl.value = data.markdown || '';
        opts.onMessage('AI response loaded (unstructured).', false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      opts.onMessage(msg, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Analyze';
    }
  });
}
