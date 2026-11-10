import { sellers } from './content';

export type Flags = {
  social: boolean;
  showCsm: boolean;
  showAnalyst: boolean;
  analytics: boolean;
  sellerKey: string;
};

function params(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  // Support both ?v=social on the page URL and #/route?v=social inside the hash.
  const search = new URLSearchParams(window.location.search);
  const hashQ = window.location.hash.split('?')[1];
  if (hashQ) new URLSearchParams(hashQ).forEach((v, k) => search.set(k, v));
  return search;
}

export function readFlags(): Flags {
  const p = params();
  const social = p.get('v') === 'social';
  const sellerKey = p.get('seller') ?? 'default';
  return {
    social,
    showCsm: !social,
    showAnalyst: false,
    analytics: false,
    sellerKey: sellerKey in sellers ? sellerKey : 'default',
  };
}

const PLACEHOLDER = /^\[.*\]$/;
export function sellerFor(key: string) {
  const s = sellers[key] ?? sellers.default;
  const clean = (v: string) => (v && !PLACEHOLDER.test(v.trim()) ? v : '');
  return { name: clean(s.name), title: clean(s.title), email: clean(s.email), phone: clean(s.phone), meetingUrl: clean(s.meetingUrl) };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Analytics hook (Mesh kit Section 9). No-op until a tool is configured; never loads a tracker on its own. */
export function track(event: string, data?: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[]; __SF_ANALYTICS__?: boolean };
  if (!w.__SF_ANALYTICS__) return;
  (w.dataLayer ??= []).push({ event, ...data });
}

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`;
