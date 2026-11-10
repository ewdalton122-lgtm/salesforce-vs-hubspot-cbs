import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Database, LayoutGrid, Bot, MessagesSquare, Sparkles } from 'lucide-react';
import { platform } from '../lib/content';
import { asset } from '../lib/env';
import { useApp } from '../context/AppContext';
import { Footnote, SectionHead } from '../components/ui';

const LAYER_ICONS = { data: Database, apps: LayoutGrid, agents: Bot, slack: MessagesSquare } as const;
// Bottom to top: data is the foundation, Slack is where people meet the platform.
const ORDER = ['data', 'apps', 'agents', 'slack'] as const;

function Stack({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  const reduce = useReducedMotion();
  const [rot, setRot] = useState({ x: 58, z: -38 });
  const drag = useRef<{ x: number; y: number; rx: number; rz: number } | null>(null);
  return (
    <div
      className="relative mx-auto h-[440px] w-full max-w-[520px] touch-pan-y select-none sm:h-[520px]"
      style={{ perspective: 1400 }}
      onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, rz: rot.z })}
      onPointerMove={(e) => {
        if (!drag.current || reduce) return;
        const d = drag.current;
        setRot({ x: Math.max(35, Math.min(72, d.rx - (e.clientY - d.y) * 0.25)), z: d.rz + (e.clientX - d.x) * 0.35 });
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <div
        className="absolute left-1/2 top-[56%] h-0 w-0"
        style={{ transformStyle: 'preserve-3d', transform: `rotateX(${rot.x}deg) rotateZ(${rot.z}deg)`, transition: drag.current ? 'none' : 'transform .6s cubic-bezier(.22,1,.36,1)' }}
      >
        {ORDER.map((id, i) => {
          const layer = platform.layers.find((l) => l.id === id)!;
          const Icon = LAYER_ICONS[id];
          const on = active === id;
          const z = i * 96 + (on ? 34 : 0);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              aria-pressed={on}
              aria-label={layer.name}
              className="absolute -left-[150px] -top-[150px] h-[300px] w-[300px] rounded-[34px] transition-[transform,box-shadow] duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateZ(${z}px)`,
                background: on
                  ? 'linear-gradient(135deg, rgba(0,179,255,.92), rgba(6,106,254,.92))'
                  : 'linear-gradient(135deg, rgba(24,80,170,.42), rgba(5,30,80,.55))',
                boxShadow: on ? '0 0 60px rgba(0,179,255,.7), inset 0 0 0 2px rgba(255,255,255,.6)' : 'inset 0 0 0 1.5px rgba(127,211,255,.45)',
              }}
            >
              <span className="absolute inset-4 rounded-[26px] opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1.2px)', backgroundSize: '18px 18px' }} />
              <span className="absolute bottom-5 left-5 flex items-center gap-2.5">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${on ? 'bg-white text-sf-blue' : 'bg-white/15 text-white'}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <span className={`whitespace-nowrap text-[19px] font-extrabold ${on ? 'text-white' : 'text-white/80'}`}>{layer.name}</span>
              </span>
            </button>
          );
        })}
        {!reduce && (
          <span
            aria-hidden
            className="pointer-events-none absolute -left-[3px] -top-[3px] h-[6px] w-[6px] rounded-full bg-white shadow-[0_0_30px_10px_rgba(0,179,255,.8)]"
            style={{ animation: 'riseZ 3.2s ease-in-out infinite' }}
          />
        )}
      </div>
      <p className="absolute inset-x-0 bottom-0 text-center text-[13px] text-night-dim">Drag to rotate · tap a layer</p>
    </div>
  );
}

export default function Platform() {
  const { industry } = useApp();
  const [active, setActive] = useState<string>('agents');
  const layer = platform.layers.find((l) => l.id === active)!;
  const examples = (platform.examples[industry.id] ?? platform.examples.all)[active] ?? [];
  const Icon = LAYER_ICONS[active as keyof typeof LAYER_ICONS];

  return (
    <section id="platform" className="stage-dark relative overflow-hidden py-28">
      <div className="pointer-events-none absolute -right-40 top-10 h-[620px] w-[620px] rounded-full bg-sf-electric/20 blur-[120px]" aria-hidden />
      <div className="wrap relative">
        <SectionHead id="platform-title" kicker="The platform" title={platform.title} accent={platform.titleAccent} sub={platform.subtitle} />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <Stack active={active} onPick={setActive} />

          <div>
            <div role="tablist" aria-label="Platform layers" className="flex flex-wrap gap-2">
              {[...ORDER].reverse().map((id) => {
                const l = platform.layers.find((x) => x.id === id)!;
                const LIcon = LAYER_ICONS[id];
                return (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={active === id}
                    onClick={() => setActive(id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-bold transition-all ${
                      active === id ? 'bg-sf-cloud text-[#020818] shadow-[0_0_24px_rgba(0,179,255,.5)]' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <LIcon size={16} aria-hidden /> {l.name}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                role="tabpanel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="glass-strong mt-5 overflow-hidden"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#03183f]">
                  <img src={asset(`assets/images/product/${layer.shot}`)} alt={`${layer.name} product view`} className="h-full w-full object-cover object-top" loading="lazy" />
                  <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#04123a] to-transparent" aria-hidden />
                </div>
                <div className="p-6 sm:p-7">
                  <p className="flex items-center gap-2 text-[14px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">
                    <Icon size={16} aria-hidden /> {layer.name}
                  </p>
                  <h3 className="mt-2 text-[26px] font-extrabold leading-tight sm:text-[30px]">{layer.tagline}</h3>
                  <p className="mt-3 text-[17.5px] leading-relaxed text-night-dim">
                    {layer.detail}
                    <Footnote id={layer.source} />
                  </p>
                  {examples.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white/70">
                        For {industry.id === 'all' ? 'services businesses' : industry.short.toLowerCase()}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {examples.map((e) => (
                          <li key={e} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[14.5px] font-semibold ring-1 ring-white/15">
                            <Sparkles size={13} className="text-sf-sky" aria-hidden /> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-16">
          <p className="text-center text-[14px] font-extrabold uppercase tracking-[0.24em] text-sf-sky">Open by design</p>
          <div className="group relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <ul className="marquee flex w-max gap-3 group-hover:[animation-play-state:paused]">
              {[...platform.openRail, ...platform.openRail].map((r, i) => (
                <li
                  key={`${r.label}-${i}`}
                  aria-hidden={i >= platform.openRail.length}
                  className="glass flex items-center gap-2.5 !rounded-full px-5 py-3 text-[16px] font-bold"
                >
                  {r.logo ? (
                    <img src={asset(`assets/logos/${r.logo}`)} alt="" className="h-5 w-5 object-contain" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-sf-cloud shadow-[0_0_10px_rgba(0,179,255,.9)]" aria-hidden />
                  )}
                  {r.label}
                  {i < platform.openRail.length && <Footnote id={r.source} />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
