import { useEffect, useState } from 'react';
import { site } from '../lib/content';
import { asset } from '../lib/env';
import { parseVtt } from '../lib/vtt';

export default function Transcript({ social }: { social: boolean }) {
  const [lines, setLines] = useState<string[] | null>(null);
  const src = social ? site.video.social.captions : site.video.master.captions;
  useEffect(() => {
    let live = true;
    fetch(asset(src))
      .then((r) => r.text())
      .then((t) => live && setLines(parseVtt(t).map((c) => c.text)))
      .catch(() => live && setLines([]));
    return () => {
      live = false;
    };
  }, [src]);
  return (
    <div className="glass mt-6 max-h-[360px] max-w-[860px] overflow-y-auto p-6 text-[17px] leading-relaxed text-white/90" aria-live="polite">
      {lines === null ? 'Loading transcript…' : lines.length ? <p>{lines.join(' ')}</p> : 'Transcript unavailable.'}
    </div>
  );
}
