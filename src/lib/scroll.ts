import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function startSmoothScroll(reducedMotion: boolean) {
  if (reducedMotion || lenis) return () => {};
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
  let raf = 0;
  const loop = (t: number) => {
    lenis?.raf(t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

/** In-page navigation. Anchor hashes are reserved for the HashRouter, so sections are reached by id. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = -(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--banner-h')) || 56);
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'auto' });
  const focusable = el.querySelector<HTMLElement>('h2, h3, [tabindex]');
  focusable?.focus({ preventScroll: true });
}
