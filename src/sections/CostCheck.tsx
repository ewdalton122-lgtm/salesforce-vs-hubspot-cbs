import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, Check, ChevronsRight, EyeOff, Info, Layers, MessageSquareQuote, Play, Plus, RotateCcw, Scale, TrendingUp, Users } from 'lucide-react';
import { checkById, cost, growth, growthStagesFor } from '../lib/content';
import { useApp } from '../context/AppContext';
import { computeTco, needMonthly, tcoVerdict, tierJump, usd } from '../lib/calc';
import { growthCounts } from '../lib/growth';
import { Footnote, HsPill } from '../components/ui';
import { track } from '../lib/env';

const DISCLAIMER =
  'List prices, billed annually, as of Nov 2026. Excludes discounts, partner services and third-party apps.';

const THUMB = 56;
const at = (f: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${f})`;

type Stages = ReturnType<typeof growthStagesFor>;

function GrowthSlider({ stages, stage, setStage }: { stages: Stages; stage: number; setStage: (n: number) => void }) {
  const n = stages.length;
  const [touched, setTouched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number>();
  const f = (stage - 1) / (n - 1);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => (stage < n ? setStage(stage + 1) : setPlaying(false)), stage === 1 ? 500 : 1100);
    return () => window.clearTimeout(timer.current);
  }, [playing, stage, n, setStage]);

  const choose = (v: number) => {
    setPlaying(false);
    setTouched(true);
    setStage(v);
  };
  const play = () => {
    setTouched(true);
    setStage(1);
    setPlaying(true);
  };

  return (
    <div className="mt-7 rounded-2xl bg-gradient-to-r from-sf-deep/40 via-white/[.04] to-sf-electric/15 p-4 ring-1 ring-sf-cloud/25 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2.5 text-[16px] font-bold text-white sm:text-[17px]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sf-electric/30 text-sf-sky ring-1 ring-sf-cloud/40">
            <TrendingUp size={17} aria-hidden />
          </span>
          As your business grows, slide right. Watch what each platform adds.
        </p>
        <button type="button" onClick={play} className="btn-ghost !px-4 !py-2 !text-[14px]">
          {stage === n && !playing ? <RotateCcw size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          {playing ? 'Growing...' : stage === n ? 'Replay growth' : 'Watch it grow'}
        </button>
      </div>

      <div className="grow-slider relative mt-5 h-[72px] select-none">
        <div className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full bg-white/10 ring-1 ring-white/10" style={{ left: THUMB / 2, right: THUMB / 2 }}>
          <div className="grow-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out" style={{ width: `${f * 100}%` }} />
        </div>
        {stages.map((s, i) => (
          <span
            key={s.stage}
            aria-hidden
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
              i < stage ? 'bg-white shadow-[0_0_12px_rgba(127,211,255,.9)]' : 'bg-white/25 ring-2 ring-white/10'
            }`}
            style={{ left: at(i / (n - 1)) }}
          />
        ))}
        <input
          type="range"
          min={1}
          max={n}
          step={1}
          value={stage}
          onChange={(e) => choose(Number(e.target.value))}
          aria-label="Growth stage"
          aria-valuetext={`Stage ${stage} of ${n}: ${stages[stage - 1].title}`}
        />
        <div className="grow-thumb-wrap pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-300 ease-out" style={{ left: at(f) }}>
          <div className={`grow-thumb grid place-items-center rounded-full text-sf-blue ${touched ? '' : 'grow-pulse'}`} style={{ width: THUMB, height: THUMB }}>
            <ChevronsRight size={28} strokeWidth={2.6} aria-hidden />
          </div>
          {!touched && (
            <span className="absolute left-full top-1/2 ml-4 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[14px] font-extrabold text-sf-blue shadow-[0_8px_24px_rgba(0,0,0,.35)]">
              Drag to grow <ChevronsRight size={17} className="grow-nudge" aria-hidden />
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-1 hidden h-[44px] md:block">
        {stages.map((s, i) => {
          const edge = i === 0 ? 'translate-x-0 text-left' : i === n - 1 ? '-translate-x-full text-right' : '-translate-x-1/2 text-center';
          const pos = i === 0 ? '0px' : i === n - 1 ? '100%' : at(i / (n - 1));
          return (
            <button
              key={s.stage}
              type="button"
              tabIndex={-1}
              onClick={() => choose(s.stage)}
              className={`absolute top-0 w-[128px] text-[13px] leading-tight transition-colors ${edge} ${
                s.stage === stage ? 'font-extrabold text-white' : s.stage < stage ? 'font-semibold text-sf-sky' : 'font-semibold text-night-dim hover:text-white'
              }`}
              style={{ left: pos }}
            >
              {s.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrowthStack() {
  const { industry } = useApp();
  const stages = useMemo(() => growthStagesFor(industry), [industry]);
  const [stage, setStage] = useState(1);
  const counts = growthCounts(stages, stage);
  return (
    <div className="glass-strong p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker-dark">Grow it yourself</p>
          <h4 className="mt-2 text-[24px] font-extrabold sm:text-[30px]">Seven stages of growth. Count what you add.</h4>
        </div>
        <p className="flex items-center gap-3 text-[16px] text-night-dim">
          <span className="rounded-full bg-sf-electric/25 px-3 py-1 text-[13px] font-extrabold uppercase tracking-[0.14em] text-sf-sky ring-1 ring-sf-cloud/40">
            Stage {stage} of {stages.length}
          </span>
          <strong className="text-white">{stages[stage - 1].title}</strong>
        </p>
      </div>
      <GrowthSlider stages={stages} stage={stage} setStage={setStage} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="flex items-center justify-between text-[14px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
            Salesforce <span className="normal-case tracking-normal text-white">{counts.salesforceTiles} {counts.salesforceTiles === 1 ? 'capability' : 'capabilities'}, one platform</span>
          </p>
          <div className="mt-3 rounded-2xl bg-gradient-to-b from-sf-electric/30 to-sf-deep/40 p-3 ring-1 ring-sf-cloud/40">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <AnimatePresence initial={false}>
                {stages.slice(0, stage).map((s) => (
                  <motion.div
                    key={s.stage}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`rounded-xl px-3 py-2.5 text-[14.5px] font-bold leading-snug transition-[box-shadow,background-color] duration-500 ${
                      s.stage === stage ? 'bg-sf-electric/35 ring-2 ring-sf-cloud shadow-[0_0_24px_rgba(0,179,255,.45)]' : 'bg-white/[.12] ring-1 ring-white/20'
                    }`}
                  >
                    {s.salesforce.label}
                    <Footnote id={s.salesforce.source} />
                    {s.salesforce.addOn && <span className="mt-1 block text-[11.5px] font-semibold text-sf-sky">License / add-on</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-sf-cloud/20 px-3 py-2 text-[13.5px] font-bold text-white">
              <Layers size={15} aria-hidden /> Same platform · same data model · same security model
            </p>
          </div>
        </div>
        <div>
          <p className="flex items-center justify-between text-[14px] font-extrabold uppercase tracking-[0.16em] text-[#b9c0cc]">
            HubSpot <span className="normal-case tracking-normal text-[#e6e9ef]">{counts.hubspotBlocks} hubs, tiers, fees and add-ons</span>
          </p>
          <div className="mt-3 flex min-h-[120px] flex-col-reverse gap-1.5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <AnimatePresence initial={false}>
              {stages.slice(0, stage).flatMap((s) =>
                s.hubspot.map((b, j) => (
                  <motion.div
                    key={`${s.stage}-${j}`}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0, rotate: (((s.stage * 7 + j * 3) % 5) - 2) * 0.35 }}
                    exit={{ opacity: 0, y: -30 }}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-[#e6e9ef] transition-colors duration-500 ${
                      s.stage === stage ? 'bg-[#5d6473] ring-1 ring-white/40' : 'bg-[#4a505d]'
                    }`}
                  >
                    <span>
                      {b.label}
                      <Footnote id={b.source} tone="gray" />
                    </span>
                    <HsPill kind={b.pill} onDark />
                  </motion.div>
                )),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="mt-5 text-[15px] text-night-dim">{growth.closing}</p>
    </div>
  );
}

const SEGMENT: Record<string, string> = {
  seats: '#677083',
  onboarding: '#7d8596',
  sync: '#939aa9',
  sandbox: '#a7adba',
  objects: '#babfc9',
  ai: '#cdd1d9',
};

const COLS = 'grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-5 lg:grid-cols-[1fr_250px_1fr] lg:items-center';
const MID = 'col-span-2 lg:col-span-1';

function useTween(value: number, ms = 650) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(value);
  const cur = useRef(value);
  const first = useRef(true);
  useEffect(() => {
    if (reduce || first.current) {
      first.current = false;
      cur.current = value;
      setV(value);
      return;
    }
    const start = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      cur.current = start + (value - start) * (1 - Math.pow(1 - k, 3));
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduce]);
  return v;
}

function Money({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const v = useTween(seen ? value : 0, seen ? 650 : 0);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {usd(Math.round(v))}
    </span>
  );
}

function TierJump() {
  const jump = tierJump(cost.tierJump);
  return (
    <div>
      <div className="mx-auto max-w-[880px] text-center">
        <p className="kicker-dark">Bundle vs. stack</p>
        <h4 className="mt-2 text-[24px] font-extrabold leading-tight sm:text-[32px]">
          One Salesforce license already includes what HubSpot sells as tiers and add-ons.
        </h4>
        <p className="mx-auto mt-3 max-w-[760px] text-[17px] text-night-dim">
          At HubSpot, custom objects, a sandbox and field-level permissions are top-tier only
          <Footnote id="hs-catalog-products" />. Then the add-ons start.
        </p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <div className="card-sf-dark flex flex-col rounded-2xl p-5 sm:p-6">
          <p className="flex items-center justify-between gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
            <span className="flex items-center gap-2">
              <Layers size={15} aria-hidden /> Salesforce
            </span>
            <span className="normal-case tracking-normal text-white">One license, included</span>
          </p>
          <ul className="mt-4 grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
            {cost.salesforce.includes.map((i, k) => (
              <motion.li
                key={i.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: k * 0.05 }}
                className="flex items-center gap-2 rounded-xl bg-white/[.12] px-3 py-2.5 text-[14px] font-bold leading-snug ring-1 ring-white/20 last:col-span-2 last:justify-center sm:last:col-span-1 sm:last:justify-start"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sf-cloud text-[#020818] shadow-[0_0_12px_rgba(127,211,255,.7)]">
                  <Check size={12} strokeWidth={3.5} aria-hidden />
                </span>
                <span>
                  {i.label}
                  <Footnote id={i.source} />
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
          <p className="flex items-center justify-between gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#b9c0cc]">
            <span className="flex items-center gap-2">
              <TrendingUp size={15} aria-hidden /> HubSpot
            </span>
            <span className="normal-case tracking-normal text-[#e6e9ef]">Climb to the top tier first</span>
          </p>
          <div className="mt-4 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-white/[.05] px-4 py-3 ring-1 ring-white/10">
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b9c0cc]">Entry tier</p>
              <p className="text-[34px] font-extrabold tabular-nums text-[#e6e9ef] sm:text-[40px]">${jump.from}</p>
            </div>
            <ArrowRight className="text-[#b9c0cc]" aria-hidden />
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b9c0cc]">Top tier</p>
              <p className="text-[34px] font-extrabold tabular-nums text-[#e6e9ef] sm:text-[40px]">
                ${jump.to}
                <span className="ml-1 align-middle text-[15px] font-bold text-[#b9c0cc]">+{jump.pct}%</span>
              </p>
            </div>
            <p className="col-span-3 -mt-1 text-center text-[13px] text-[#b9c0cc]">
              Per user per month, list
              <Footnote id={cost.tierJump.source} tone="gray" />
            </p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[14px] font-bold text-[#e6e9ef]">
            <p className="flex items-center gap-2 rounded-xl bg-[#4a505d] px-3 py-2.5">
              <Plus size={14} className="shrink-0 text-[#b9c0cc]" aria-hidden />
              <span>
                {usd(cost.hubspot.onboardingPerHub)} onboarding per hub
                <Footnote id={cost.hubspot.onboardingSource} tone="gray" />
              </span>
            </p>
            <p className="flex items-center gap-2 rounded-xl bg-[#4a505d] px-3 py-2.5">
              <Plus size={14} className="shrink-0 text-[#b9c0cc]" aria-hidden />
              <span>Add-ons for sync, sandboxes, objects and AI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Switch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-bold leading-snug transition-colors ${
        on ? 'bg-sf-electric/30 text-white ring-1 ring-sf-cloud/60' : 'bg-white/[.06] text-night-dim ring-1 ring-white/10 hover:text-white'
      }`}
    >
      {label}
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-sf-cloud' : 'bg-white/20'}`} aria-hidden>
        <motion.span
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          animate={{ left: on ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

function SfIncluded({ text, source, on = true }: { text: string; source: string; on?: boolean }) {
  return (
    <div className={`flex flex-col items-end text-right transition-opacity duration-300 ${on ? '' : 'opacity-35'}`}>
      <span className="flex items-center gap-1.5 rounded-full bg-sf-cloud/20 px-2.5 py-1 text-[12.5px] font-extrabold uppercase tracking-wider text-sf-sky ring-1 ring-sf-cloud/50">
        <Check size={13} strokeWidth={3} aria-hidden /> Included
      </span>
      <span className="mt-1 text-[13.5px] font-semibold text-[#d5e3f7]">
        {text}
        <Footnote id={source} />
      </span>
    </div>
  );
}

function HsCost({ id, amount, text, source, on = true }: { id: string; amount: number; text: string; source: string; on?: boolean }) {
  return (
    <div className={`text-left transition-opacity duration-300 ${on ? '' : 'opacity-35'}`}>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: SEGMENT[id] }} aria-hidden />
        {on ? <Money value={amount} className="text-[19px] font-extrabold text-[#e6e9ef]" /> : <span className="text-[15px] font-bold text-[#9aa2b1]">Not needed</span>}
      </span>
      <span className="mt-1 block text-[13.5px] font-semibold text-[#b9c0cc]">
        {text}
        <Footnote id={source} tone="gray" />
      </span>
    </div>
  );
}

function Calculator() {
  const { industry } = useApp();
  const d = cost.defaults;
  const [seats, setSeats] = useState({ salesSeats: d.salesSeats, serviceSeats: d.serviceSeats });
  const [years, setYears] = useState(d.years);
  const [needs, setNeeds] = useState<Record<string, boolean>>(() => Object.fromEntries(cost.needs.map((n) => [n.id, n.default])));
  const [pack, setPack] = useState(cost.needs.find((n) => n.packs)?.defaultPack ?? '');
  const r = useMemo(() => computeTco(cost, { ...seats, years, needs, pack }), [seats, years, needs, pack]);
  const v = tcoVerdict(cost, r, years);
  const max = Math.max(r.salesforce, r.hubspot);
  const amount = (id: string) => r.stack.find((l) => l.id === id)?.amount ?? 0;
  const users = `${r.seats} ${r.seats === 1 ? 'user' : 'users'}`;
  const perUser = (n: number) => Math.round(n / (r.seats * r.months));
  const fill = (x: number, min: number, maxV: number) => `${((x - min) / (maxV - min)) * 100}%`;
  const toggle = (id: string) => {
    setNeeds((s) => ({ ...s, [id]: !s[id] }));
    track('calc_change', { field: id });
  };
  const excluded = cost.excluded.filter((e) => industry.field || !e.fieldOnly);
  const ledger = useRef<HTMLDivElement>(null);
  const seen = useInView(ledger, { once: true, amount: 0.3 });
  const width = (n: number) => (seen ? `${(n / max) * 100}%` : '0%');

  return (
    <div className="glass-strong mt-4 p-5 sm:p-8">
      <TierJump />

      <form className="mt-8 grid gap-3 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()} aria-label="Cost scenario">
        {(['salesSeats', 'serviceSeats'] as const).map((k) => {
          const rg = cost.inputs[k];
          return (
            <label key={k} className="block rounded-2xl bg-white/[.05] px-4 py-3.5 ring-1 ring-white/10">
              <span className="flex items-center justify-between text-[15px] font-bold">
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-sf-sky" aria-hidden />
                  {k === 'salesSeats' ? 'Sales users' : 'Service users'}
                </span>
                <span className="rounded-md bg-sf-electric/30 px-2 py-0.5 tabular-nums text-white">{seats[k]}</span>
              </span>
              <input
                type="range"
                className="range mt-3"
                min={rg.min}
                max={rg.max}
                step={rg.step}
                value={seats[k]}
                style={{ ['--fill' as string]: fill(seats[k], rg.min, rg.max) }}
                onChange={(e) => {
                  setSeats((s) => ({ ...s, [k]: Number(e.target.value) }));
                  track('calc_change', { field: k });
                }}
              />
            </label>
          );
        })}
        <fieldset className="rounded-2xl bg-white/[.05] px-4 py-3.5 ring-1 ring-white/10">
          <legend className="sr-only">Contract length</legend>
          <span className="flex items-center gap-2 text-[15px] font-bold" aria-hidden>
            <CalendarDays size={15} className="text-sf-sky" /> Contract length
          </span>
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {cost.inputs.years.options.map((y) => (
              <button
                key={y}
                type="button"
                aria-pressed={years === y}
                onClick={() => {
                  setYears(y);
                  track('calc_change', { field: 'years' });
                }}
                className={`rounded-lg py-1.5 text-[15px] font-bold transition-colors ${years === y ? 'bg-sf-cloud text-[#020818]' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {y} yr
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      <div ref={ledger} className="mt-4 rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10 sm:p-6" aria-live="polite">
        <div className={COLS}>
          <div className="text-right">
            <p className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">Salesforce</p>
            <Money value={r.salesforce} className="mt-1 block text-[28px] font-extrabold leading-none text-white sm:text-[44px]" />
            <p className="mt-1.5 text-[13.5px] font-semibold text-[#d5e3f7]">${perUser(r.salesforce)} per user per month, all in</p>
          </div>
          <div className={`${MID} order-first text-center lg:order-none`}>
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-[14px] font-extrabold text-sf-blue shadow-[0_0_24px_rgba(127,211,255,.55)]">vs</span>
            <p className="mt-2 text-[13px] font-extrabold uppercase tracking-[0.14em] text-white">
              {years}-year total, at list
            </p>
            <p className="text-[13px] text-night-dim">
              {users}, same scope
            </p>
          </div>
          <div className="text-left">
            <p className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-[#b9c0cc]">HubSpot stack</p>
            <Money value={r.hubspot} className="mt-1 block text-[28px] font-extrabold leading-none text-[#e6e9ef] sm:text-[44px]" />
            <p className="mt-1.5 text-[13.5px] font-semibold text-[#b9c0cc]">${perUser(r.hubspot)} per user per month, all in</p>
          </div>

          <div className="flex h-6 justify-end">
            <motion.div
              className="h-full rounded-l-full bg-gradient-to-l from-sf-cloud to-sf-electric shadow-[0_0_22px_rgba(0,179,255,.6)]"
              initial={{ width: '0%' }}
              animate={{ width: width(r.salesforce) }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </div>
          <p className="hidden text-center text-[12.5px] font-bold uppercase tracking-[0.14em] text-night-dim lg:block">
            One price <span className="text-white/40">|</span> Stacked
          </p>
          <div className="flex h-6 justify-start">
            <motion.div
              className="flex h-full gap-[2px] overflow-hidden rounded-r-full"
              initial={{ width: '0%' }}
              animate={{ width: width(r.hubspot) }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            >
              <AnimatePresence initial={false}>
                {r.stack
                  .filter((l) => l.amount > 0)
                  .map((l) => (
                    <motion.span
                      key={l.id}
                      className="h-full"
                      style={{ background: SEGMENT[l.id] }}
                      initial={{ flexGrow: 0 }}
                      animate={{ flexGrow: l.amount }}
                      exit={{ flexGrow: 0 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                    />
                  ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
          <div className={COLS}>
            <div className="text-right">
              <Money value={r.salesforce} className="text-[19px] font-extrabold text-white" />
              <span className="mt-1 block text-[13.5px] font-semibold text-[#d5e3f7]">
                ${cost.salesforce.seatPrice} per user per month × {r.seats}
                <Footnote id={cost.salesforce.source} />
              </span>
            </div>
            <p className={`${MID} order-first rounded-xl bg-white/[.06] px-3 py-2.5 text-center text-[14.5px] font-bold ring-1 ring-white/10 lg:order-none`}>Licenses</p>
            <HsCost id="seats" amount={amount('seats')} text={`$${cost.hubspot.seatPrice} per user per month, top tier × ${r.seats}`} source={cost.hubspot.seatSource} />
          </div>

          <div className={COLS}>
            <div className="flex flex-col items-end text-right">
              <span className="flex items-center gap-1.5 rounded-full bg-sf-cloud/20 px-2.5 py-1 text-[12.5px] font-extrabold uppercase tracking-wider text-sf-sky ring-1 ring-sf-cloud/50">
                <Check size={13} strokeWidth={3} aria-hidden /> None
              </span>
              <span className="mt-1 text-[13.5px] font-semibold text-[#d5e3f7]">No onboarding fee in the price</span>
            </div>
            <p className={`${MID} order-first rounded-xl bg-white/[.06] px-3 py-2.5 text-center text-[14.5px] font-bold ring-1 ring-white/10 lg:order-none`}>Required onboarding</p>
            <HsCost
              id="onboarding"
              amount={amount('onboarding')}
              text={`${usd(cost.hubspot.onboardingPerHub)} per hub × ${r.hubs}, one-time`}
              source={cost.hubspot.onboardingSource}
            />
          </div>

          {cost.needs.map((n) => {
            const on = !!needs[n.id];
            const monthly = needMonthly(n, pack);
            return (
              <div key={n.id} className={COLS}>
                <SfIncluded text={n.salesforce} source={n.sfSource} on={on} />
                <div className={`${MID} order-first lg:order-none`}>
                  <Switch on={on} label={n.label} onClick={() => toggle(n.id)} />
                  {n.packs && (
                    <div className="mt-1.5 grid grid-cols-3 gap-1" role="radiogroup" aria-label="HubSpot credit pack">
                      {n.packs.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={pack === p.id}
                          onClick={() => {
                            setPack(p.id);
                            setNeeds((s) => ({ ...s, [n.id]: true }));
                            track('calc_change', { field: 'pack' });
                          }}
                          className={`rounded-lg px-1 py-1 text-[12px] font-bold leading-tight transition-colors ${
                            on && pack === p.id ? 'bg-white text-sf-blue' : 'bg-white/[.07] text-night-dim hover:text-white'
                          }`}
                        >
                          {p.label}
                          <span className="block text-[11px] font-semibold opacity-80">{(p.credits / 1000).toLocaleString('en-US')}K/mo</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <HsCost id={n.id} amount={amount(n.id)} text={`${n.hubspot}, $${monthly.toLocaleString('en-US')} a month`} source={n.source} on={on} />
              </div>
            );
          })}

          <div className={COLS}>
            <div className="flex flex-wrap justify-end gap-1.5">
              {cost.salesforce.includes.slice(-3).map((i) => (
                <span key={i.label} className="rounded-full bg-white/[.12] px-2.5 py-1 text-[12.5px] font-bold text-white ring-1 ring-white/20">
                  {i.label}
                  <Footnote id={i.source} />
                </span>
              ))}
            </div>
            <p className={`${MID} order-first rounded-xl bg-sf-electric/20 px-3 py-2.5 text-center text-[14.5px] font-bold text-white ring-1 ring-sf-cloud/40 lg:order-none`}>
              Also in the license
            </p>
            <p className="text-[13.5px] font-semibold text-[#9aa2b1]">Not in the HubSpot total</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={v.kind}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`mt-4 flex flex-col items-center gap-3 rounded-2xl px-5 py-4 text-center sm:flex-row sm:text-left ${
            v.kind === 'under' ? 'card-sf-dark' : 'bg-sf-electric/20 ring-1 ring-sf-cloud/40'
          }`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-sf-blue">
            <Scale size={20} aria-hidden />
          </span>
          <p className="flex-1 text-[17px] font-bold leading-snug text-white sm:text-[18.5px]">{v.text}</p>
          {v.kind === 'under' && (
            <span className="shrink-0 rounded-full bg-white px-4 py-1.5 text-[15px] font-extrabold tabular-nums text-sf-blue">
              <Money value={v.diff} /> under
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
          <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">
            <EyeOff size={14} aria-hidden /> Not in the quote
          </p>
          <p className="mt-2 text-[16px] font-extrabold leading-snug">{cost.hiddenCosts.title}</p>
          <ul className="mt-3 grid flex-1 content-start gap-x-4 gap-y-2 text-[14.5px] leading-snug text-[#cfd4de] sm:grid-cols-2">
            {cost.hiddenCosts.items
              .filter((h) => industry.field || !cost.hiddenCosts.fieldOnly.includes(h))
              .map((h) => (
                <li key={h} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a93a6]" aria-hidden />
                  {h}
                </li>
              ))}
          </ul>
        </div>
        <div className="flex flex-col rounded-2xl bg-gradient-to-br from-sf-electric/35 to-sf-blue/20 p-5 ring-1 ring-sf-cloud/40">
          <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
            <MessageSquareQuote size={14} aria-hidden /> Ask HubSpot
          </p>
          <p className="flex flex-1 items-center py-4 text-[19px] font-bold leading-snug text-white sm:text-[22px]">“{checkById('cost').askLive}”</p>
          <p className="rounded-xl bg-white/10 px-3.5 py-2.5 text-[13.5px] text-[#d5e3f7]">
            Not in this comparison:{' '}
            {excluded.map((e, i) => (
              <span key={e.label}>
                {i > 0 && ' and '}
                {e.label}
                <Footnote id={e.source} />
              </span>
            ))}
            . {excluded.length > 1 ? 'Both are' : "It's an"} add-on{excluded.length > 1 ? 's' : ''} on either side.
          </p>
        </div>
      </div>

      <p className="mt-4 flex gap-2 rounded-xl bg-white/5 px-4 py-3 text-[14px] text-[#d5e3f7] ring-1 ring-white/10">
        <Info size={16} className="mt-0.5 shrink-0 text-sf-sky" aria-hidden />
        <span>
          {DISCLAIMER} {cost.disclosure}
        </span>
      </p>
    </div>
  );
}

export default function CostCheck() {
  return (
    <div className="mx-auto mt-10 max-w-[1180px]">
      <GrowthStack />
      <Calculator />
    </div>
  );
}
