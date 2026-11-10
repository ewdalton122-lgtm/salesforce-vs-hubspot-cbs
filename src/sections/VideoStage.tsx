import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { site } from '../lib/content';
import { asset, track } from '../lib/env';
import { scrollToId } from '../lib/scroll';
import { useApp } from '../context/AppContext';

/**
 * The star of the show. On a desktop window the whole 16:9 frame, native controls included,
 * is visible on load, and nothing is layered over it.
 */
export default function VideoStage() {
  const { flags } = useApp();
  const v = flags.social ? site.video.social : site.video.master;
  const ref = useRef<HTMLVideoElement>(null);
  const [lit, setLit] = useState(false);
  const fired = useRef(new Set<number>());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => {
      if (!el.duration) return;
      setLit(el.duration - el.currentTime <= site.video.cueLeadSeconds);
      const pct = Math.floor((el.currentTime / el.duration) * 4) * 25;
      if (pct > 0 && !fired.current.has(pct)) {
        fired.current.add(pct);
        track(`video_progress_${pct}`);
      }
    };
    const onPlay = () => track('video_play');
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  return (
    <section id="top" aria-label={`Video: ${site.video.label}`} className="video-stage stage-dark flex flex-col items-center justify-center gap-3 overflow-hidden px-3 py-4 sm:px-6">
      <div className="streak" aria-hidden />
      <div className="flare" style={{ right: '6%', top: '12%' }} aria-hidden />
      <div className="grain" aria-hidden />
      <div className="video-frame relative overflow-hidden rounded-[22px] bg-black shadow-[0_30px_90px_rgba(0,0,0,.55),0_0_0_1px_rgba(127,211,255,.18),0_0_60px_rgba(6,106,254,.25)]">
        <video
          ref={ref}
          className="block h-full w-full"
          controls
          playsInline
          preload="metadata"
          poster={asset(v.poster)}
          aria-label={`${site.video.label}, ${v.length}. Captions are part of the video.`}
        >
          <source src={asset(v.src)} type="video/mp4" />
          <track kind="captions" srcLang="en" label="English" src={asset(v.captions)} />
        </video>
      </div>
      <button
        type="button"
        onClick={() => scrollToId('intro')}
        className={`cue no-print inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[14px] font-bold text-white/90 ${lit ? 'lit !px-6' : ''}`}
      >
        {lit && <span className="rounded-full bg-[#020818] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-sf-sky">{site.video.cueLit}</span>}
        {site.video.cue}
        <ChevronDown size={16} className="bob" aria-hidden />
      </button>
    </section>
  );
}
