import type { Source } from './content';

// Sources that render as a numbered footnote. 'positioning' is a Salesforce point of view and
// renders as a statement, not a fact.
export const NON_FOOTNOTE_SOURCES = new Set(['positioning']);

export function isFootnotable(id: string): boolean {
  return !NON_FOOTNOTE_SOURCES.has(id);
}

/**
 * Stable footnote numbers: sources are numbered in the order they first appear in the page's
 * content walk (the same order the page renders), so a number never changes between renders.
 */
export function numberSources(referencedInOrder: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of referencedInOrder) {
    if (!isFootnotable(id) || map.has(id)) continue;
    map.set(id, map.size + 1);
  }
  return map;
}

export function sourceHref(s: Source): string | null {
  if (s.internal || s.anonymized || !s.url) return null;
  return s.url;
}

export function formatAsOf(asOf?: string): string {
  if (!asOf) return '';
  const [y, m] = asOf.split('-').map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${month} ${y}`;
}
