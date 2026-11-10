import { ExternalLink } from 'lucide-react';
import { site, sources } from '../lib/content';
import { formatAsOf, sourceHref } from '../lib/footnotes';
import { footnoteNumbers } from '../lib/sourceOrder';
import { SfLogo } from '../components/ui';

export default function Sources() {
  const list = [...footnoteNumbers.entries()].sort((a, b) => a[1] - b[1]);
  return (
    <footer id="sources" className="bg-[#020818] py-20 text-[#a9b8d6]">
      <div className="wrap">
        <h2 id="sources-title" tabIndex={-1} className="text-[26px] font-extrabold text-white outline-none">Sources</h2>
        <ol className="mt-6 grid gap-x-10 gap-y-2.5 text-[14px] leading-snug md:grid-cols-2">
          {list.map(([id, n]) => {
            const s = sources[id];
            const href = sourceHref(s);
            return (
              <li key={id} id={`src-${id}`} className="flex scroll-mt-24 gap-3">
                <span className="w-6 shrink-0 text-right font-extrabold text-sf-sky">{n}</span>
                <span>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-sf-sky">
                      {s.label}
                      <ExternalLink size={12} className="ml-1 inline" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-white">{s.label}</span>
                  )}
                  {s.asOf && <span className="text-[#7d8db0]"> · as of {formatAsOf(s.asOf)}</span>}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-14 space-y-3 border-t border-white/10 pt-8 text-[13px] leading-relaxed">
          <p>{site.legal.disclaimer}</p>
          <p>{site.legal.phrasing}</p>
          <p>{site.legal.trademark}</p>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <SfLogo className="h-9" />
            <p>{site.legal.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
