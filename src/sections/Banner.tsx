import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { site } from '../lib/content';
import { scrollToId } from '../lib/scroll';
import { SfLogo } from '../components/ui';

const LINKS: Array<[string, string]> = [
  ['checks', 'The 5 checks'],
  ['platform', 'Platform'],
  ['build', 'Build your future'],
  ['proof', 'Proof'],
  ['prove-it', 'Prove it'],
];

export default function Banner() {
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? scrollY / max : 0);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className="no-print sticky top-0 z-50 h-[var(--banner-h)] border-b border-white/10 bg-[#020818]/90 backdrop-blur-xl">
      <a href="#main" onClick={(e) => { e.preventDefault(); go('intro'); }} className="sr-only-focusable absolute left-3 top-2 z-50 rounded bg-white px-3 py-2 text-ink">
        Skip the video
      </a>
      <div className="flex h-full items-center gap-4 px-4 sm:px-6">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex shrink-0 items-center gap-3" aria-label="Back to top">
          <SfLogo className="h-8" />
          <span className="hidden h-6 w-px bg-white/20 sm:block" />
          <span className="hidden flex-col text-left leading-tight sm:flex">
            <strong className="text-[15px] font-extrabold tracking-tight">{site.banner.title}</strong>
            <span className="text-[12px] text-night-dim">{site.banner.subtitle}</span>
          </span>
        </button>
        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => go(id)} className="rounded-lg px-3 py-2 text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              {label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => go('contact')} className="btn-primary ml-auto !px-4 !py-2 !text-[14px] lg:ml-2">
          {site.banner.cta}
        </button>
        <button type="button" className="rounded-lg p-2 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Sections" className="absolute inset-x-0 top-full border-b border-white/10 bg-[#020818]/97 p-3 lg:hidden">
          {LINKS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => go(id)} className="block w-full rounded-lg px-3 py-3 text-left text-[16px] font-semibold hover:bg-white/10">
              {label}
            </button>
          ))}
        </nav>
      )}
      <div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-sf-blue via-sf-cloud to-sf-ice" style={{ transform: `scaleX(${progress})` }} aria-hidden />
    </header>
  );
}
