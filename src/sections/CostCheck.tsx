import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, ChevronsRight, EyeOff, Info, Layers, MessageSquareQuote, Play, RotateCcw, Scale, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import { checkById, cost, growth, growthStagesFor } from '../lib/content';
import { useApp } from '../context/AppContext';
import { computeAll, tierJump, usd, type CalcInputs, type CalcResult } from '../lib/calc';
import { growthCounts } from '../lib/growth';
import { Footnote, HsPill } from '../components/ui';
import { track } from '../lib/env';

const DISCLAIMER =
  'List prices, per user per month, billed annually, as of Nov 2026. Excludes discounts, partner services and third-party apps. Validate scope with your Salesforce account executive.';

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

type Side = { r: CalcResult; price: string; have?: string[]; lack?: string[]; extra?: string; source: string };

function Bar({ side, max, sf }: { side: Side; max: number; sf: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={`text-[16px] font-extrabold ${sf ? 'text-white' : 'text-[#dfe3ea]'}`}>
          {side.r.label.replace(' (Sales + Service)', '')}
          <Footnote id={side.source} tone={sf ? 'dark' : 'gray'} />
        </span>
        <span className={`text-[22px] font-extrabold tabular-nums ${sf ? 'text-white' : 'text-[#e6e9ef]'}`}>{usd(side.r.total)}</span>
      </div>
      <div className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-white/[.08]">
        <motion.div
          className={`h-full rounded-full ${sf ? 'bg-gradient-to-r from-sf-electric to-sf-cloud shadow-[0_0_16px_rgba(0,179,255,.6)]' : 'bg-[#7a8294]'}`}
          animate={{ width: `${(side.r.total / max) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
        <span className="text-night-dim">{side.price}</span>
        {side.have?.map((h) => (
          <span key={h} className={`flex items-center gap-1 font-semibold ${sf ? 'text-sf-sky' : 'text-[#cfd4de]'}`}>
            <Check size={13} strokeWidth={3} aria-hidden /> {h}
          </span>
        ))}
        {side.lack?.map((h) => (
          <span key={h} className="flex items-center gap-1 font-semibold text-[#9aa2b1]">
            <X size={13} strokeWidth={3} aria-hidden /> <span className="line-through decoration-[#9aa2b1]/60">{h}</span>
          </span>
        ))}
        {side.extra && <span className="font-semibold text-[#cfd4de]">+ {side.extra}</span>}
      </div>
    </div>
  );
}

function Matchup({ n, kicker, title, sf, hs, verdict, best }: { n: number; kicker: string; title: string; sf: Side; hs: Side; verdict: string; best?: boolean }) {
  const max = Math.max(sf.r.total, hs.r.total);
  return (
    <div className={`rounded-2xl p-5 ${best ? 'card-sf-dark' : 'bg-white/5 ring-1 ring-white/10'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
          Matchup {n} · {kicker}
        </p>
        {best && (
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider text-sf-blue">
            <Scale size={13} aria-hidden /> Apples to apples
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[19px] font-extrabold leading-snug">{title}</p>
      <div className="mt-4 space-y-4">
        <Bar side={sf} max={max} sf />
        <Bar side={hs} max={max} sf={false} />
      </div>
      <p className={`mt-4 rounded-xl px-4 py-3 text-[15.5px] font-bold leading-snug ${best ? 'bg-white/15 text-white' : 'bg-sf-electric/20 text-white ring-1 ring-sf-cloud/30'}`}>{verdict}</p>
    </div>
  );
}

function Calculator() {
  const { industry } = useApp();
  const [inp, setInp] = useState<CalcInputs>({
    salesSeats: cost.defaults.salesSeats,
    serviceSeats: cost.defaults.serviceSeats,
    years: cost.defaults.years,
    includeDataHub: cost.inputs.includeDataHub.default,
    includeSfApiAddon: cost.inputs.includeSfApiAddon.default,
  });
  const jump = useMemo(() => tierJump(cost.options), []);
  const results = useMemo(() => computeAll(cost.options, inp), [inp]);
  const by = Object.fromEntries(results.map((r) => [r.id, r]));
  const integrate = inp.includeDataHub && inp.includeSfApiAddon;
  const set = <K extends keyof CalcInputs>(k: K, v: CalcInputs[K]) => {
    setInp((s) => ({ ...s, [k]: v }));
    track('calc_change', { field: k });
  };
  const seat = Object.fromEntries(cost.options.map((o) => [o.id, o.seatPrice]));
  const yrs = `${inp.years} ${inp.years === 1 ? 'year' : 'years'}`;
  const sfPro = seat['sf-pro'] + (integrate ? 25 : 0);
  const sfSide: Side = {
    r: by['sf-pro'],
    price: `$${sfPro} per user per month${integrate ? ' incl. API add-on' : ''}`,
    have: ['Custom objects', 'Sandbox'],
    source: 'sf-pricing-sales',
  };
  const lessBy = (hs: CalcResult) => {
    const d = hs.total - by['sf-pro'].total;
    return `Salesforce costs ${usd(d)} less over ${yrs}, ${Math.round((d / hs.total) * 100)}% below HubSpot.`;
  };
  const entryVerdict =
    by['sf-pro'].total <= by['hs-pro'].total
      ? `${lessBy(by['hs-pro'])} And it includes custom objects and a sandbox.`
      : `For $${sfPro - seat['hs-pro']} more per user per month, Salesforce includes custom objects and a sandbox${integrate ? ', plus API access for two-way integration' : ''}. HubSpot Professional doesn't offer them, so growing means moving to Enterprise (matchup 1).`;
  const fill = (v: number, min: number, maxV: number) => `${((v - min) / (maxV - min)) * 100}%`;

  return (
    <div className="glass-strong mt-4 p-6 sm:p-8">
      <p className="kicker-dark">The tier jump</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <h4 className="text-[24px] font-extrabold leading-tight sm:text-[30px]">
            The capabilities a growing services business needs sit in HubSpot&apos;s top tier.
          </h4>
          <p className="mt-3 text-[17px] text-night-dim">
            Custom objects, a sandbox and field-level permissions are Enterprise-only at HubSpot
            <Footnote id="hs-catalog-products" />. Salesforce Pro Suite includes custom objects and a sandbox
            <Footnote id="sf-pricing-sales" />.
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b9c0cc]">HubSpot Pro</p>
            <p className="text-[34px] font-extrabold tabular-nums text-[#e6e9ef] sm:text-[40px]">${jump.from}</p>
          </div>
          <ArrowRight className="text-[#b9c0cc]" aria-hidden />
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b9c0cc]">HubSpot Enterprise</p>
            <p className="text-[34px] font-extrabold tabular-nums text-[#e6e9ef] sm:text-[40px]">
              ${jump.to}
              <span className="ml-1 align-middle text-[15px] font-bold text-[#b9c0cc]">+{jump.pct}%</span>
            </p>
          </div>
          <p className="col-span-3 rounded-xl bg-gradient-to-r from-sf-electric to-sf-blue px-4 py-3 text-center text-[16px] font-bold text-white">
            Salesforce Pro Suite: ${jump.sf} per user per month, custom objects and sandbox included
            <Footnote id="sf-pricing-sales" />
          </p>
          <p className="col-span-3 text-center text-[13px] text-[#b9c0cc]">
            Per user per month. Plus a required onboarding fee per HubSpot hub
            <Footnote id="hs-pricing-sales" tone="gray" />.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
        <div className="flex flex-col gap-4">
        <form className="space-y-5 rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10" onSubmit={(e) => e.preventDefault()} aria-label="Cost scenario">
          <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">
            <SlidersHorizontal size={14} aria-hidden /> Your scenario
          </p>
          {(['salesSeats', 'serviceSeats'] as const).map((k) => {
            const r = cost.inputs[k];
            return (
              <label key={k} className="block">
                <span className="flex justify-between text-[15px] font-bold">
                  {k === 'salesSeats' ? 'Sales users' : 'Service users'}
                  <span className="tabular-nums text-sf-sky">{inp[k]}</span>
                </span>
                <input
                  type="range"
                  className="range mt-2"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={inp[k]}
                  style={{ ['--fill' as string]: fill(inp[k], r.min, r.max) }}
                  onChange={(e) => set(k, Number(e.target.value))}
                />
              </label>
            );
          })}
          <fieldset>
            <legend className="text-[15px] font-bold">Contract length</legend>
            <div className="mt-2 flex gap-2">
              {cost.inputs.years.options.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={inp.years === y}
                  onClick={() => set('years', y)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[15px] font-bold ${inp.years === y ? 'bg-sf-cloud text-[#020818]' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {y} yr
                </button>
              ))}
            </div>
          </fieldset>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/5 p-3.5 text-[15px] ring-1 ring-white/10">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#0176d3]"
              checked={integrate}
              onChange={(e) => {
                setInp((st) => ({ ...st, includeDataHub: e.target.checked, includeSfApiAddon: e.target.checked }));
                track('calc_change', { field: 'integrate' });
              }}
            />
            <span>
              <span className="font-bold">We&apos;ll connect our ERP or data warehouse (two-way)</span>
              <span className="mt-1 block text-[13.5px] text-night-dim">
                Adds what each side requires: HubSpot Data Hub Enterprise, $2,000 a month
                <Footnote id="hs-pricing-data" />, and the Salesforce Web Services API add-on, $25 per user per month on Pro Suite
                <Footnote id="sf-pricing-sales" />.
              </span>
            </span>
          </label>
        </form>

        <div className="flex flex-1 flex-col rounded-2xl bg-white/[.04] p-5 ring-1 ring-white/10">
          <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">
            <EyeOff size={14} aria-hidden /> Not in the quote
          </p>
          <p className="mt-2 text-[16px] font-extrabold leading-snug">{cost.hiddenCosts.title}</p>
          <ul className="mt-3 space-y-2.5 text-[14.5px] leading-snug text-[#cfd4de]">
            {cost.hiddenCosts.items.filter((h) => industry.field || !cost.hiddenCosts.fieldOnly.includes(h)).map((h) => (
              <li key={h} className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a93a6]" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-5">
            <div className="rounded-xl bg-gradient-to-br from-sf-electric/35 to-sf-blue/20 p-4 ring-1 ring-sf-cloud/40">
              <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
                <MessageSquareQuote size={14} aria-hidden /> Ask HubSpot
              </p>
              <p className="mt-1.5 text-[14.5px] font-semibold leading-snug text-white">“{checkById('cost').askLive}”</p>
            </div>
          </div>
        </div>
        </div>

        <div>
          <div className="space-y-4" aria-live="polite">
            <Matchup
              n={1}
              best
              kicker="Same capabilities"
              title="Custom objects and a sandbox on both sides"
              sf={sfSide}
              hs={{
                r: by['hs-ent'],
                price: `$${seat['hs-ent']} per user per month${integrate ? ' + Data Hub $2,000 a month' : ''}`,
                have: ['Custom objects', 'Sandbox'],
                extra: `${usd(by['hs-ent'].oneTime)} onboarding`,
                source: 'hs-catalog-products',
              }}
              verdict={lessBy(by['hs-ent'])}
            />
            <Matchup
              n={2}
              kicker="Entry tiers"
              title="What each entry tier includes"
              sf={sfSide}
              hs={{
                r: by['hs-pro'],
                price: `$${seat['hs-pro']} per user per month`,
                lack: ['Custom objects', 'Sandbox', 'Field-level permissions', ...(integrate ? ['Two-way warehouse sync'] : [])],
                extra: `${usd(by['hs-pro'].oneTime)} onboarding`,
                source: 'hs-pricing-sales',
              }}
              verdict={entryVerdict}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sf-electric/30 text-sf-sky ring-1 ring-sf-cloud/40">
                <ArrowUpRight size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] font-extrabold">
                  The step up: Salesforce Core
                  <Footnote id="sf-pricing-sales" />
                </p>
                <p className="text-[13.5px] text-night-dim">${seat['sf-core']} per user per month · Includes 500K Flex Credits per org.</p>
              </div>
              <p className="text-[19px] font-extrabold tabular-nums">
                {usd(by['sf-core'].total)}
                <span className="ml-1 text-[13px] font-semibold text-night-dim">/ {yrs}</span>
              </p>
            </div>
          </div>
          <p className="mt-5 flex gap-2 rounded-xl bg-white/5 px-4 py-3 text-[14px] text-[#d5e3f7] ring-1 ring-white/10">
            <Info size={16} className="mt-0.5 shrink-0 text-sf-sky" aria-hidden />
            <span>{DISCLAIMER}</span>
          </p>
        </div>
      </div>

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
