import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Pause, Phone, Play, Repeat, Zap } from 'lucide-react';
import { journey } from '../lib/content';
import { computeHandoffs, computeSystems, tallyUpTo } from '../lib/journey';
import { useApp } from '../context/AppContext';
import { Footnote, HsPill } from '../components/ui';

const STEP_MS = 2200;
const END_HOLD_MS = 4200;
const steps = journey.steps;
const last = steps.length - 1;
const allSystems = computeSystems(steps);
const totalHandoffs = computeHandoffs(steps);
// Neutral grays only: HubSpot never gets brand color.
const SYSTEM_SHADES = ['#c1c7d2', '#7f8799', '#555c6c', '#9ea6b5'];
const shade = (system: string) => SYSTEM_SHADES[allSystems.indexOf(system) % SYSTEM_SHADES.length];
const isHandoff = (i: number) => i > 0 && steps[i].hubspot.system !== steps[i - 1].hubspot.system;

export default function FollowTheCall() {
  const { industry } = useApp();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const [step, setStep] = useState(reduce ? last : -1);
  const [paused, setPaused] = useState(false);
  const running = inView && !paused && !reduce;

  useEffect(() => {
    if (!running) return;
    const wait = step < 0 ? 400 : step >= last ? END_HOLD_MS : STEP_MS;
    const t = setTimeout(() => setStep((s) => (s >= last ? 0 : s + 1)), wait);
    return () => clearTimeout(t);
  }, [running, step]);

  const tally = step >= 0 ? tallyUpTo(steps, step) : { systems: 0, handoffs: 0 };
  const scenario = (journey.scenarios as Record<string, string>)[industry.id] ?? journey.scenarios.all;
  const done = step >= last;
  const controls = { running, paused, reduce: !!reduce, toggle: () => setPaused((p) => !p) };

  return (
    <div ref={ref} className="glass-strong mx-auto mt-10 max-w-[1180px] p-6 sm:p-8">
      <div className="max-w-[720px]">
        <p className="kicker-dark">Follow the call</p>
        <h4 className="mt-2 flex items-center gap-3 text-[24px] font-extrabold leading-tight sm:text-[30px]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sf-cloud text-[#020818]">
            <Phone size={18} aria-hidden />
          </span>
          {scenario}
        </h4>
        <p className="mt-3 text-[16px] text-night-dim">Same call, two paths. Keep an eye on the scoreboard as the HubSpot path changes systems.</p>
      </div>

      <MobileTally step={step} tally={tally} {...controls} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <ol className="space-y-2.5">
          {steps.map((s, i) => {
            const on = i <= step;
            const current = i === step;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => (setPaused(true), setStep(i))}
                  aria-current={current ? 'step' : undefined}
                  className={`w-full rounded-2xl p-3 text-left transition-all duration-500 ${
                    current ? 'bg-white/[.10] ring-2 ring-sf-cloud/70 shadow-[0_0_40px_rgba(0,140,255,.25)]' : on ? 'bg-white/[.05]' : 'bg-transparent opacity-45 hover:opacity-80'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-extrabold transition-colors ${on ? 'bg-sf-cloud text-[#020818]' : 'bg-white/10'}`}>{s.n}</span>
                    <span className="text-[16px] font-bold leading-snug">{s.title}</span>
                  </span>
                  <span className="mt-2.5 grid gap-2 md:grid-cols-2">
                    <span className="relative rounded-xl bg-gradient-to-r from-sf-electric/50 to-sf-blue/40 px-3 py-2 text-[14.5px] ring-1 ring-sf-cloud/40">
                      <strong className="text-white">{s.salesforce.product}.</strong> <span className="text-white/90">{s.salesforce.text}</span>
                      <Footnote id={s.salesforce.source} />
                    </span>
                    <span className={`relative rounded-xl px-3 py-2 text-[14.5px] ring-1 ${s.hubspot.status === 'native' ? 'bg-white/[.07] ring-white/15' : 'bg-[#3d424e] ring-white/10'}`}>
                      {isHandoff(i) && on && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-[#c3c9d4] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1c1f26]"
                        >
                          <Zap size={11} aria-hidden /> Handoff
                        </motion.span>
                      )}
                      <span className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: shade(s.hubspot.system) }} aria-hidden />
                        <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#b9c0cc]">{s.hubspot.system}</span>
                        <HsPill kind={s.hubspot.status === 'integration' ? 'customBuild' : s.hubspot.status} onDark />
                      </span>
                      <span className="text-[#cfd4de]">{s.hubspot.text}</span>
                      <Footnote id={s.hubspot.source} tone="gray" />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <Scoreboard step={step} tally={tally} done={done} {...controls} />
      </div>
    </div>
  );
}

type Controls = { running: boolean; paused: boolean; reduce: boolean; toggle: () => void };
type Tally = { systems: number; handoffs: number };

function PlayToggle({ paused, reduce, toggle, small = false }: Controls & { small?: boolean }) {
  if (reduce) return null;
  return (
    <button type="button" onClick={toggle} className={`btn-ghost ${small ? '!px-2.5 !py-1.5' : '!px-3 !py-1.5 !text-[13px]'}`} aria-label={paused ? 'Play' : 'Pause'}>
      {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
      {!small && (paused ? 'Play' : 'Pause')}
    </button>
  );
}

function Num({ value, sf = false, size = 'lg' }: { value: number; sf?: boolean; size?: 'lg' | 'sm' }) {
  return (
    <span className={`relative inline-block overflow-hidden tabular-nums ${size === 'lg' ? 'h-[52px] text-[46px]' : 'h-[30px] text-[26px]'} font-extrabold leading-none ${sf ? 'text-white' : 'text-[#eef0f4]'}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="block pt-1" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** One cell per step. Salesforce is one continuous line; HubSpot breaks wherever the system changes. */
function PathTrack({ step, sf }: { step: number; sf: boolean }) {
  if (sf)
    return (
      <div className="h-3 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-sf-blue to-sf-cloud shadow-[0_0_14px_rgba(0,179,255,.7)] transition-[width] duration-500 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
    );
  return (
    <div className="flex items-center" aria-hidden>
      {steps.map((s, i) => {
        const on = i <= step;
        const gap = isHandoff(i);
        return (
          <Fragment key={s.n}>
            {gap && (
              <span className={`relative mx-[3px] grid h-4 w-4 shrink-0 place-items-center transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-25'}`}>
                <Zap size={12} className="text-[#d5dae3]" />
                {on && i === step && <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />}
              </span>
            )}
            <span className={`h-3 flex-1 rounded-[3px] transition-opacity duration-500 ${on ? '' : 'opacity-20'}`} style={{ background: shade(s.hubspot.system) }} />
          </Fragment>
        );
      })}
    </div>
  );
}

function Scoreboard({ step, tally, done, ...c }: Controls & { step: number; tally: Tally; done: boolean }) {
  const seen = step >= 0 ? computeSystems(steps.slice(0, step + 1)) : [];
  return (
    <aside className="hidden lg:sticky lg:top-[calc(var(--banner-h)+76px)] lg:block" aria-label="Live tally">
      <div className="overflow-hidden rounded-2xl bg-[#061633]/90 ring-1 ring-sf-cloud/30 shadow-[0_24px_60px_rgba(0,0,0,.35)]">
        <div className="flex items-center justify-between gap-2 px-5 pt-4">
          <p className="flex items-center gap-2 whitespace-nowrap text-[12px] font-extrabold uppercase tracking-[0.12em] text-sf-sky">
            {c.running && <span className="h-2 w-2 animate-pulse rounded-full bg-sf-cloud" aria-hidden />}
            Live tally · {step < 0 ? 'Ready' : `Step ${step + 1}/${steps.length}`}
          </p>
          <PlayToggle {...c} />
        </div>
        <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          {c.running && step >= 0 && (
            <motion.div
              key={step}
              className="h-full bg-sf-cloud/80"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: (done ? END_HOLD_MS : STEP_MS) / 1000, ease: 'linear' }}
            />
          )}
        </div>

        <div className="mt-4 border-t border-white/10 bg-gradient-to-br from-sf-electric/25 to-transparent px-5 py-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">Salesforce</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <Num value={step >= 0 ? 1 : 0} sf />
              <p className="text-[12.5px] font-bold text-sf-sky">platform</p>
            </div>
            <div>
              <Num value={0} sf />
              <p className="text-[12.5px] font-bold text-sf-sky">handoffs</p>
            </div>
          </div>
          <div className="mt-3">
            <PathTrack step={step} sf />
          </div>
          <p className="mt-2 text-[12.5px] text-white/80">One platform, end to end.</p>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">HubSpot</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <Num value={tally.systems} />
              <p className="text-[12.5px] font-bold text-[#b9c0cc]">{tally.systems === 1 ? 'system' : 'systems'}</p>
            </div>
            <div>
              <Num value={tally.handoffs} />
              <p className="text-[12.5px] font-bold text-[#b9c0cc]">{tally.handoffs === 1 ? 'handoff' : 'handoffs'}</p>
            </div>
          </div>
          <div className="mt-3">
            <PathTrack step={step} sf={false} />
          </div>
          <ul className="mt-3 space-y-1.5">
            <AnimatePresence initial={false}>
              {seen.map((sys) => (
                <motion.li
                  key={sys}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-white/[.06] px-2.5 py-1.5 text-[13px] font-semibold text-[#dfe3ea]"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: shade(sys) }} aria-hidden />
                  {sys}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="border-t border-white/10 px-5 py-3.5" aria-live="polite">
          <p className="text-[14px] font-bold leading-snug">
            {done
              ? `End to end: 1 platform on Salesforce. ${allSystems.length} systems and ${totalHandoffs} handoffs on the HubSpot path.`
              : 'Each lightning bolt is a handoff: the call moves to a different system.'}
          </p>
          {!c.reduce && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-night-dim">
              <Repeat size={12} aria-hidden /> {c.paused ? 'Paused. Press play to keep it running.' : 'Plays on a loop while this section is on screen.'}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function MobileTally({ step, tally, ...c }: Controls & { step: number; tally: Tally }) {
  return (
    <div className="sticky top-[calc(var(--banner-h)+60px)] z-10 mt-6 lg:hidden">
      <div className="rounded-2xl bg-[#061633]/95 px-3.5 py-3 ring-1 ring-sf-cloud/30 shadow-[0_16px_40px_rgba(0,0,0,.4)] backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sf-sky">
            {c.running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sf-cloud" aria-hidden />}
            Live tally · {step < 0 ? 'Ready' : `Step ${step + 1}/${steps.length}`}
          </p>
          <PlayToggle {...c} small />
        </div>
        <div className="mt-2 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sf-sky">Salesforce</span>
              <span className="flex items-center gap-3">
                <MiniStat value={step >= 0 ? 1 : 0} label="platform" sf />
                <MiniStat value={0} label="handoffs" sf />
              </span>
            </div>
            <div className="mt-1">
              <PathTrack step={step} sf />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#b9c0cc]">HubSpot</span>
              <span className="flex items-center gap-3">
                <MiniStat value={tally.systems} label={tally.systems === 1 ? 'system' : 'systems'} />
                <MiniStat value={tally.handoffs} label={tally.handoffs === 1 ? 'handoff' : 'handoffs'} />
              </span>
            </div>
            <div className="mt-1">
              <PathTrack step={step} sf={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label, sf = false }: { value: number; label: string; sf?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <Num value={value} sf={sf} size="sm" />
      <span className={`text-[11.5px] font-bold leading-tight ${sf ? 'text-white/85' : 'text-[#cfd4de]'}`}>{label}</span>
    </span>
  );
}
