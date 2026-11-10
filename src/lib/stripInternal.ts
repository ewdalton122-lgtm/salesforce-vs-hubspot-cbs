/**
 * The content JSON carries internal guidance for whoever edits it (notes, guardrails, presentation
 * rules, test fixtures). The page never renders these, but a bundled JSON file ships whole, so the
 * production build removes them before they reach the browser.
 */
export const INTERNAL_KEYS = new Set([
  '_note',
  'guardrail',
  'presentationRules',
  'distribution',
  'aiNote',
  'citation',
  'formula',
  'referenceCheck',
  'micrositeDetail',
  'analyst',
  'trigger',
  'hubs',
]);

// Editor instructions inside otherwise public strings, e.g. "Don't state an allotment period."
const INSTRUCTION = /(?:^|\s)(?:Don't|Do not|Never|NEVER|Confirm|Recheck)\b[^.]*\.?/g;

export function stripInternal<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripInternal) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (INTERNAL_KEYS.has(k)) continue;
      out[k] = k === 'note' && typeof v === 'string' ? v.replace(INSTRUCTION, '').trim() : stripInternal(v);
    }
    return out as T;
  }
  return value;
}

