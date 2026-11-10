import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, Check, Flag, Sunrise } from 'lucide-react';
import { checkById, growth, industries, story, type FrictionKindT } from '../lib/content';
import { asset } from '../lib/env';
import { scrollToId } from '../lib/scroll';
import { useApp } from '../context/AppContext';
import { FallsShort, Footnote, HsMark, SfTick, StatValue } from '../components/ui';
import { INDUSTRY_ICONS } from '../components/icons';
import { CHECK_ICONS } from './Intro';
import { scene } from '../three/sceneStore';
import CostCheck from './CostCheck';
import FollowTheCall from './FollowTheCall';

const World = lazy(() => import('../three/World'));

const KINDS: FrictionKindT[] = ['gate', 'addon', 'app', 'limit'];
const SHORT: Record<string, string> = {
  'data-model': 'Data model',
  cost: 'Cost of growing',
  operations: 'Operations',
  governance: 'Governance',
  'ai-data': 'AI & data',
};
const STEPS = [
  { id: 'act-day-one', short: 'Day one' },
  ...story.acts.map((a) => ({ id: `act-${a.checkId}`, short: SHORT[a.checkId] ?? checkById(a.checkId).title })),
  { id: 'act-finale', short: 'Two futures' },
];

function useStoryProgress(blocks: React.MutableRefObject<Array<HTMLElement | null>>) {
  const [act, setAct] = useState(0);
  const [frac, setFrac] = useState(0);
  useEffect(() => {
    let raf = 0;
    let lastAct = -1;
    let lastFrac = -1;
    const tick = () => {
      const anchor = window.innerHeight * 0.6;
      let p = 0;
      for (const el of blocks.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        p += Math.min(1, Math.max(0, (anchor - r.top) / r.height));
      }
      scene.p = p;
      const a = Math.min(6, Math.floor(p));
      const f = Math.round((p - Math.floor(p)) * 20) / 20;
      if (a !== lastAct) setAct((lastAct = a));
      if (f !== lastFrac) setFrac((lastFrac = f));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [blocks]);
  return { act, frac };
}

function useNear(ref: React.RefObject<HTMLElement>, margin: string) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}

/** Below 640px the 3D labels would crowd the cards, so the cards carry the text alone. */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

function Stills({ act }: { act: number }) {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 7 }, (_, i) => (
        <img
          key={i}
          src={asset(`assets/stills/act-${i}.webp`)}
          alt=""
          aria-hidden
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: i === act ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

function Hud({ act, frac }: { act: number; frac: number }) {
  const tallies = useMemo(() => {
    const t: Record<FrictionKindT, number> = { gate: 0, addon: 0, app: 0, limit: 0 };
    story.acts.forEach((a, i) => {
      const actIndex = i + 1;
      if (act > actIndex || (act === actIndex && frac >= 0.45)) a.frictions.forEach((f) => (t[f.kind] += 1));
    });
    return t;
  }, [act, frac]);
  const total = KINDS.reduce((s, k) => s + tallies[k], 0);
  const passed = Math.max(0, Math.min(5, act - (frac >= 0.45 ? 0 : 1)));

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-3 top-20 sm:left-6">
        <div className="glass-strong !rounded-2xl px-4 py-3">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">Salesforce</p>
          <p className="mt-1 text-[15px] font-bold sm:text-[17px]">One platform</p>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/80">
            <Check size={14} className="text-sf-cloud" aria-hidden /> {passed} of 5 checks met
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-20 sm:right-6">
        <div className="glass-gray !rounded-2xl px-4 py-3 text-right">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">HubSpot</p>
          <p className="mt-1 text-[15px] font-bold text-[#e6e9ef] sm:text-[17px]">
            <span className="tabular-nums">{total}</span> friction points
          </p>
          <ul className="mt-2 hidden space-y-1 text-[12.5px] text-[#cfd4de] sm:block">
            {KINDS.map((k) => (
              <li key={k} className="flex items-center justify-end gap-2">
                {story.kindLabels[k]}
                <motion.span key={tallies[k]} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-white/15 px-1 text-[12px] font-extrabold tabular-nums text-white">
                  {tallies[k]}
                </motion.span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {STEPS[act]?.short}. HubSpot friction points so far: {total}.
      </p>
    </div>
  );
}

function Stepper({ act }: { act: number }) {
  return (
    <div className="pointer-events-none sticky top-[calc(var(--banner-h)_+_12px)] z-30 h-0">
      <div className="flex justify-center px-3">
        <ol className="pointer-events-auto glass-strong flex items-center gap-1 !rounded-full p-1.5" aria-label="Story progress">
          {STEPS.map((s, i) => {
            const Icon = i === 0 ? Sunrise : i === 6 ? Flag : CHECK_ICONS[i - 1];
            const on = i === act;
            const done = i < act;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(s.id)}
                  aria-current={on ? 'step' : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-bold transition-all ${
                    on ? 'bg-gradient-to-r from-sf-electric to-sf-cloud text-white shadow-[0_0_24px_rgba(0,179,255,.5)]' : done ? 'text-sf-sky' : 'text-white/55 hover:text-white'
                  }`}
                >
                  <Icon size={15} aria-hidden />
                  <span className={on ? 'inline' : 'hidden xl:inline'}>{s.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function IndustryChips() {
  const { industry, setIndustry } = useApp();
  return (
    <div role="group" aria-label="Choose your industry" className="mt-6 flex flex-wrap justify-center gap-2">
      {industries.map((ind) => {
        const Icon = INDUSTRY_ICONS[ind.icon] ?? Building2;
        const on = industry.id === ind.id;
        return (
          <button
            key={ind.id}
            type="button"
            aria-pressed={on}
            onClick={() => setIndustry(ind.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-bold transition-all ${
              on ? 'bg-sf-cloud text-[#020818] shadow-[0_0_20px_rgba(0,179,255,.45)]' : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20'
            }`}
          >
            <Icon size={15} aria-hidden /> {ind.short}
          </button>
        );
      })}
    </div>
  );
}

function TitleCard({ kicker, title, body, children }: { kicker: string; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong mx-auto max-w-[760px] p-6 text-center sm:p-8"
    >
      <p className="kicker-dark justify-center">{kicker}</p>
      <h3 className="mt-3 text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[44px]">{title}</h3>
      {body && <p className="mt-4 text-[18px] leading-relaxed text-night-dim sm:text-[20px]">{body}</p>}
      {children}
    </motion.div>
  );
}

function Verdict({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-6 max-w-[900px] text-center text-[26px] font-extrabold leading-tight tracking-tight sm:text-[34px]"
    >
      <span className="grad-text">{text}</span>
    </motion.p>
  );
}

function Compare({ checkId, idx }: { checkId: string; idx: number }) {
  const c = checkById(checkId);
  const a = story.acts[idx];
  const Icon = CHECK_ICONS[idx];
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1180px]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="card-sf-dark p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
              <Icon size={22} aria-hidden />
            </span>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-white/85">Salesforce</p>
          </div>
          <h4 className="mt-4 text-[24px] font-extrabold leading-snug sm:text-[28px]">{c.salesforce.headline}</h4>
          <p className="mt-2 text-[17px] text-white/85">{a.sfVisual}</p>
          <ul className="mt-5 space-y-3">
            {c.salesforce.points.map((pt) => (
              <li key={pt.label} className="flex gap-3 text-[17px] leading-snug">
                <SfTick size={24} />
                <span>
                  {pt.stat && (
                    <span className="mr-2 text-[26px] font-extrabold leading-none text-white">
                      <StatValue value={`${pt.stat.value}${pt.stat.suffix}`} />
                    </span>
                  )}
                  {pt.label}
                  <Footnote id={pt.source} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-hs-dark p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#b9c0cc]">HubSpot</p>
            <FallsShort />
          </div>
          <p className="mt-4 text-[18px] font-bold text-[#e6e9ef]">{a.hsVisual}</p>
          <ul className="mt-5 space-y-3">
            {c.hubspot.points.map((pt) => (
              <li key={pt.label} className="flex gap-3 text-[16.5px] leading-snug text-[#cfd4de]">
                <HsMark size={22} />
                <span>
                  {pt.label}
                  <Footnote id={pt.source} tone="gray" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="glass mt-4 flex flex-col gap-2 !rounded-2xl px-5 py-4 sm:flex-row sm:items-center">
        <span className="shrink-0 text-[13px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">Ask HubSpot to show it live</span>
        <span className="text-[17px] font-semibold">“{c.askLive}”</span>
      </div>
      <Verdict text={a.verdict} />
    </motion.div>
  );
}

export default function Story() {
  const { industry, webgl, reducedMotion } = useApp();
  const reduce = useReducedMotion() || reducedMotion;
  const section = useRef<HTMLElement>(null);
  const blocks = useRef<Array<HTMLElement | null>>([]);
  const { act, frac } = useStoryProgress(blocks);
  const near = useNear(section, '60% 0px 60% 0px');
  const live = useNear(section, '0px');
  const use3d = webgl && !reduce;
  const narrow = useNarrow();

  const tileLabels = useMemo(() => growth.stages.map((s) => s.salesforce.label), []);
  const towerBlocks = useMemo(() => growth.stages.reduce((n, s) => n + s.hubspot.length, 0), []);
  const setBlock = (i: number) => (el: HTMLElement | null) => {
    blocks.current[i] = el;
  };

  return (
    <section ref={section} id="checks" aria-labelledby="checks-title" className="relative bg-[#020b1f]">
      <h2 id="checks-title" tabIndex={-1} className="sr-only">
        The five checks: Salesforce and HubSpot, as your business grows
      </h2>
      <div className="sticky top-[var(--banner-h)] -mb-[calc(100svh_-_var(--banner-h))] h-[calc(100svh_-_var(--banner-h))] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(6,106,254,.28),transparent_55%),radial-gradient(ellipse_at_75%_45%,rgba(120,130,150,.12),transparent_55%)]" />
        {use3d && near ? (
          <Suspense fallback={null}>
            <World
              active={live}
              act={narrow ? -1 : act}
              skin={industry.skin}
              objects={industry.objects}
              tileLabels={tileLabels}
              towerBlocks={towerBlocks}
            />
          </Suspense>
        ) : (
          !use3d && <Stills act={act} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020b1f] to-transparent" />
        <Hud act={act} frac={frac} />
      </div>
      <div className="relative z-20">
        <Stepper act={act} />
        <article ref={setBlock(0)} id="act-day-one" className="min-h-[200vh] px-4 pb-[40vh] pt-[18vh]">
          <TitleCard kicker={story.dayOne.kicker} title={story.dayOne.title} body={story.dayOne.body}>
            <IndustryChips />
          </TitleCard>
          <div className="h-[70vh]" />
          <Verdict text={story.dayOne.verdict} />
        </article>

        {story.acts.map((a, i) => {
          const c = checkById(a.checkId);
          return (
            <article key={a.checkId} ref={setBlock(i + 1)} id={`act-${a.checkId}`} aria-labelledby={`h-${a.checkId}`} className="min-h-[240vh] px-4 pb-[30vh] pt-[16vh]">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.5 }}
                transition={{ duration: 0.7 }}
                className="glass-strong mx-auto max-w-[720px] p-6 text-center sm:p-7"
              >
                <p className="kicker-dark justify-center">Check {c.number} of 5</p>
                <h3 id={`h-${a.checkId}`} className="mt-3 text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[42px]">
                  {c.title} <span className="grad-text">{c.titleAccent}</span>
                </h3>
                <p className="mt-3 text-[19px] text-night-dim">{a.scene}</p>
              </motion.div>
              <div className="h-[85vh]" />
              <Compare checkId={a.checkId} idx={i} />
              {a.checkId === 'cost' && <CostCheck />}
              {a.checkId === 'operations' && <FollowTheCall />}
            </article>
          );
        })}

        <article ref={setBlock(6)} id="act-finale" className="min-h-[200vh] px-4 pb-[24vh] pt-[30vh]">
          <div className="h-[30vh]" />
          <TitleCard kicker={story.finale.kicker} title={story.finale.title} body={story.finale.body} />
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.8 }}
            className="mx-auto mt-[40vh] max-w-[1040px] rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(2,8,24,.82),rgba(2,8,24,.35)_70%,transparent)] px-6 py-6 text-center text-[40px] font-extrabold leading-[1.02] tracking-tight sm:text-[64px]"
          >
            <span className="grad-text">{story.finale.verdict}</span>
          </motion.p>
        </article>
      </div>
      {/* Lets the sticky stepper release before the next section starts, and fades the scene out. */}
      <div className="relative z-20 h-48 bg-gradient-to-b from-transparent to-[#020818]" aria-hidden />
    </section>
  );
}
