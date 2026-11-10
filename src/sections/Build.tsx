import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, Info, Layers, Link2, RotateCcw, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { checks, simulator, type SimInputs } from '../lib/content';
import { BASELINE, decodeInputs, encodeInputs, evaluate, hasScenario, stripScenario } from '../lib/simulator';
import { creditCalendar, creditMath } from '../lib/credits';
import { useApp } from '../context/AppContext';
import { Footnote, HsPill, SectionHead, SfTick } from '../components/ui';
import { track } from '../lib/env';
import { CHECK_ICONS } from './Intro';

const RULES = simulator.rules;
const A = simulator.assumptions;
const iconFor = (check: string) => CHECK_ICONS[Math.max(0, checks.checks.findIndex((c) => c.id === check))];
const AI_LINE = Math.floor(A.includedCredits / A.creditsPerConversation) + 1;
const USER_CAP = 2500;

type NumKey = 'brands' | 'accessTeams' | 'users' | 'linesOfBusiness' | 'technicians' | 'aiConversations';
type BoolKey = 'phone' | 'erp' | 'warehouse';

/** One control per rule tile. `line` is where the HubSpot rule kicks in, marked on the slider. */
const SLIDERS: Array<{ k: NumKey; rule: string; label: string; min: number; max: number; step: number; line: number }> = [
  { k: 'brands', rule: 'brands', label: 'Brands or acquired companies', min: 1, max: 20, step: 1, line: 2 },
  { k: 'accessTeams', rule: 'access', label: 'Teams that need different access', min: 1, max: 12, step: 1, line: 2 },
  { k: 'users', rule: 'users', label: 'CRM users', min: 25, max: 5000, step: 25, line: USER_CAP + 1 },
  { k: 'linesOfBusiness', rule: 'lob', label: 'Lines of business', min: 1, max: 10, step: 1, line: 2 },
  { k: 'technicians', rule: 'field', label: 'Field technicians', min: 0, max: 1000, step: 5, line: 1 },
  { k: 'aiConversations', rule: 'ai', label: 'AI agent conversations a month', min: 0, max: 10000, step: 100, line: AI_LINE },
];
const TOGGLES: Array<{ k: BoolKey; rule: string; label: string; full: string }> = [
  { k: 'phone', rule: 'voice', label: 'Customers call', full: 'Customers call us' },
  { k: 'erp', rule: 'erp', label: 'ERP billing', full: 'We bill from an ERP' },
  { k: 'warehouse', rule: 'warehouse', label: 'Data warehouse', full: 'We have a data warehouse' },
];
const CONTROL_FOR = Object.fromEntries([...SLIDERS, ...TOGGLES].map((c) => [c.rule, c]));
const GLYPH: Record<string, typeof Building2> = { brands: Building2, access: ShieldCheck, lob: Layers };
const frac = (v: number, min: number, max: number) => Math.min(1, Math.max(0, (v - min) / (max - min)));
const at = (f: number) => `calc(11px + (100% - 22px) * ${f})`;

export default function Build() {
  const { industry } = useApp();
  const loc = useLocation();
  const [params, setParams] = useSearchParams();
  const [inp, setInp] = useState<SimInputs>(() => (hasScenario(params.toString()) ? decodeInputs(params.toString(), BASELINE) : BASELINE));
  const [copied, setCopied] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const lastIndustry = useRef(industry.id);

  // A shared link loads once; the address is cleaned so a reload starts from day one.
  useEffect(() => {
    if (hasScenario(params.toString())) setParams(new URLSearchParams(stripScenario(params.toString())), { replace: true, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastIndustry.current === industry.id) return;
    lastIndustry.current = industry.id;
    setInp(BASELINE);
    setFocus(null);
  }, [industry]);

  const result = useMemo(() => evaluate(inp, RULES, A), [inp]);
  const calendar = creditCalendar(result.credits.daysCovered, A.daysPerMonth);
  const set = <K extends keyof SimInputs>(k: K, v: SimInputs[K], rule: string) => {
    setInp((s) => ({ ...s, [k]: v }));
    setFocus(rule);
    track('sim_change', { field: k });
  };

  const hit = useMemo(() => new Map(result.findings.map((f) => [f.id, f])), [result]);
  const prev = useRef<Set<string>>(new Set(hit.keys()));
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const added = [...hit.keys()].filter((id) => !prev.current.has(id));
    prev.current = new Set(hit.keys());
    if (added.length) {
      setFresh(added[added.length - 1]);
      setFocus(added[added.length - 1]);
    }
  }, [hit]);
  const shownId = focus ?? result.findings[result.findings.length - 1]?.id ?? null;
  const shownRule = shownId ? RULES.find((r) => r.id === shownId) : undefined;
  const shownHit = shownId ? hit.get(shownId) : undefined;
  const typical = industry.id === 'all' ? 'services business' : `${industry.short.toLowerCase()} business`;

  const copyLink = async () => {
    const qs = new URLSearchParams(stripScenario(params.toString()));
    new URLSearchParams(encodeInputs(inp)).forEach((v, k) => qs.set(k, v));
    try {
      await navigator.clipboard.writeText(`${window.location.href.split('#')[0]}#${loc.pathname}?${qs.toString()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section id="build" className="stage-dark relative overflow-clip py-28">
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[560px] w-[560px] rounded-full bg-sf-cloud/15 blur-[120px]" aria-hidden />
      <div className="wrap relative">
        <SectionHead
          id="build-title"
          kicker="Build your future"
          title="Size it to your business."
          accent="See what changes."
          sub="Start on day one, then grow. Each control lights one of nine things you'd have to plan around on HubSpot."
        />

        <div className="sticky top-[calc(var(--banner-h)+8px)] z-20 mt-10 lg:hidden" aria-hidden>
          <div className="flex items-center gap-3 rounded-2xl bg-[#061633]/95 px-4 py-2.5 ring-1 ring-sf-cloud/30 shadow-[0_16px_40px_rgba(0,0,0,.4)] backdrop-blur">
            <span className="whitespace-nowrap text-[12.5px] font-extrabold text-sf-sky">Salesforce: 1 platform</span>
            <span className="ml-auto whitespace-nowrap text-[12.5px] font-extrabold text-[#e6e9ef]">
              HubSpot: <span className="tabular-nums">{result.findings.length}</span> of {RULES.length}
            </span>
            <span className="flex w-14 shrink-0 gap-[2px]">
              {RULES.map((r, i) => (
                <span key={r.id} className={`h-2 flex-1 rounded-full ${i < result.findings.length ? 'bg-[#c3c9d4]' : 'bg-white/15'}`} />
              ))}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-5 lg:mt-12 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-4">
            <div className="glass-strong px-5 py-4">
              <form onSubmit={(e) => e.preventDefault()} aria-label="Your business" className="space-y-2.5">
                {SLIDERS.map(({ k, rule, label, min, max, step, line }) => {
                  const crossed = hit.has(rule);
                  return (
                    <label key={k} className="block">
                      <span className="flex justify-between gap-3 text-[13.5px] font-bold">
                        {label}
                        <span className={`tabular-nums transition-colors ${crossed ? 'text-white' : 'text-sf-sky'}`}>{inp[k].toLocaleString('en-US')}</span>
                      </span>
                      <span className="relative mt-1 block">
                        <input
                          type="range"
                          className="range"
                          min={min}
                          max={max}
                          step={step}
                          value={Math.min(Math.max(inp[k], min), max)}
                          style={{ ['--fill' as string]: `${frac(inp[k], min, max) * 100}%` }}
                          onChange={(e) => set(k, Number(e.target.value), rule)}
                          onFocus={() => setFocus(rule)}
                        />
                        <span
                          className={`pointer-events-none absolute -top-[3px] h-3 w-[3px] -translate-x-1/2 rounded-full transition-colors ${crossed ? 'bg-[#c3c9d4]' : 'bg-white/35'}`}
                          style={{ left: at(frac(line, min, max)) }}
                          title="Where HubSpot's limit kicks in"
                          aria-hidden
                        />
                      </span>
                    </label>
                  );
                })}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {TOGGLES.map(({ k, rule, label, full }) => (
                    <button
                      key={k}
                      type="button"
                      title={full}
                      aria-label={full}
                      aria-pressed={inp[k]}
                      onClick={() => set(k, !inp[k], rule)}
                      className={`rounded-xl px-2 py-2 text-center text-[13px] font-bold leading-tight transition-all ${
                        inp[k] ? 'bg-sf-cloud text-[#020818] shadow-[0_0_20px_rgba(0,179,255,.35)]' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" className="btn-ghost !gap-1.5 !px-2 !py-1.5 !text-[12.5px]" onClick={() => (setInp(BASELINE), setFocus(null))}>
                    <RotateCcw size={13} aria-hidden /> Start over
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !gap-1.5 !px-2 !py-1.5 !text-[12.5px]"
                    title={`Load a typical ${typical}`}
                    aria-label={`Load a typical ${typical}`}
                    onClick={() => (setInp(industry.simulatorDefaults), track('sim_typical'))}
                  >
                    <Wand2 size={13} aria-hidden /> Typical
                  </button>
                  <button type="button" className="btn-ghost !gap-1.5 !px-2 !py-1.5 !text-[12.5px]" onClick={copyLink}>
                    <Link2 size={13} aria-hidden /> {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-strong flex-1 px-5 py-4">
              <p className="flex items-center justify-between gap-2 text-[15.5px] font-extrabold">
                A month of AI agents
                <span className="group relative">
                  <button type="button" className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-sf-sky hover:bg-white/20" aria-label={`Assumptions: ${A.tooltip}`}>
                    <Info size={14} aria-hidden />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-[280px] rounded-lg bg-[#020818] px-3 py-2 text-[12.5px] font-medium leading-snug text-white opacity-0 shadow-xl ring-1 ring-white/15 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    {A.tooltip}
                  </span>
                </span>
              </p>
              {inp.aiConversations > 0 ? (
                <div className="mt-2.5 space-y-2.5">
                  <CalendarRow label="Salesforce" days={calendar.map(() => true)} sf note="Flex Credits last the whole contract term." source="sf-agentforce-pricing" />
                  <CalendarRow
                    label="HubSpot"
                    days={calendar}
                    note={
                      result.credits.exceeds
                        ? `Included credits cover about ${result.credits.daysCovered} ${result.credits.daysCovered === 1 ? 'day' : 'days'}. Then agents pause unless you buy packs.`
                        : 'Included credits cover the month at this volume.'
                    }
                    source={A.source}
                  />
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-night-dim">Slide AI agent conversations up to see how long included credits last.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card-sf-dark px-4 py-3.5">
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-white/85">Salesforce</p>
                <p className="mt-0.5 text-[24px] font-extrabold leading-tight">One platform</p>
                <p className="text-[13.5px] text-white/85">
                  {result.findings.length > 0 ? (
                    <>
                      <motion.span key={result.findings.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold tabular-nums text-white">
                        {result.findings.length} of {RULES.length}
                      </motion.span>{' '}
                      needs covered, on the same data and security model.
                    </>
                  ) : (
                    'Every need below lands on the same data and security model.'
                  )}
                </p>
              </div>
              <div className="card-hs-dark px-4 py-3.5">
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">HubSpot</p>
                <p className="mt-0.5 text-[24px] font-extrabold leading-tight text-[#e6e9ef]">
                  <motion.span key={result.findings.length} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block tabular-nums">
                    {result.findings.length}
                  </motion.span>{' '}
                  of {RULES.length} things to plan around
                </p>
                <div className="mt-2 flex gap-1" aria-hidden>
                  {RULES.map((r, i) => (
                    <span key={r.id} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i < result.findings.length ? 'bg-[#c3c9d4]' : 'bg-white/10'}`} />
                  ))}
                </div>
                <div className="mt-2 flex min-h-[22px] flex-wrap gap-1.5">
                  {Object.entries(result.counts).map(([pill, n]) => (
                    <span key={pill} className="flex items-center gap-1">
                      <HsPill kind={pill} onDark />
                      <span className="text-[12.5px] font-bold tabular-nums text-[#e6e9ef]">×{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="What your business needs">
              {RULES.map((r) => {
                const f = hit.get(r.id);
                const Icon = iconFor(r.check);
                const sel = shownId === r.id;
                return (
                  <li key={r.id}>
                    <motion.button
                      type="button"
                      onClick={() => setFocus(r.id)}
                      aria-pressed={sel}
                      animate={f && fresh === r.id ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`flex h-full min-h-[88px] w-full flex-col rounded-2xl p-2.5 text-left transition-[background-color,box-shadow,opacity,border-color] duration-500 ${
                        f
                          ? `bg-[#3a3f4b] ${sel ? 'ring-2 ring-sf-cloud shadow-[0_0_28px_rgba(0,179,255,.3)]' : 'ring-1 ring-white/20 hover:ring-white/40'}`
                          : `border border-dashed bg-white/[.03] ${sel ? 'border-sf-cloud/70 opacity-100' : 'border-white/20 opacity-60 hover:opacity-80'}`
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <Icon size={15} className={`mt-0.5 shrink-0 ${f ? 'text-white' : 'text-white/50'}`} aria-hidden />
                        <span className={`text-[13.5px] font-bold leading-snug ${f ? 'text-white' : 'text-white/70'}`}>{r.short}</span>
                      </span>
                      <TileMeter rule={r.id} inp={inp} lit={!!f} />
                      <span className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-1.5">
                        <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-sf-sky">
                          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-sf-cloud text-[#020818]">
                            <Check size={9} strokeWidth={4} aria-hidden />
                          </span>
                          Salesforce
                        </span>
                        {f ? <HsPill kind={r.hubspot.pill} onDark /> : <span className="text-[11.5px] font-semibold text-white/45">{r.when}</span>}
                      </span>
                    </motion.button>
                  </li>
                );
              })}
            </ul>

            <div className="glass-strong flex-1 p-4 sm:p-5" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {shownRule ? (
                  <motion.div key={shownRule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="flex items-center gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
                        {fresh === shownRule.id && shownHit && <Sparkles size={13} aria-hidden />} {shownRule.short}
                      </p>
                      <p className="text-[12.5px] text-night-dim">Tap any tile to compare it.</p>
                    </div>
                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                      <div className="flex gap-2.5 rounded-xl bg-gradient-to-r from-sf-electric/40 to-sf-blue/25 p-3.5 text-[14.5px] leading-snug ring-1 ring-sf-cloud/40">
                        <SfTick size={20} />
                        <span>
                          {shownRule.salesforce.text}
                          <Footnote id={shownRule.salesforce.source} />
                        </span>
                      </div>
                      {shownHit ? (
                        <div className="flex flex-col gap-2 rounded-xl bg-[#3a3f4b] p-3.5 text-[14px] leading-snug text-[#cfd4de] ring-1 ring-white/10">
                          <HsPill kind={shownRule.hubspot.pill} onDark />
                          <span>
                            {shownHit.hubspotText}
                            <Footnote id={shownRule.hubspot.source} tone="gray" />
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center gap-1 rounded-xl border border-dashed border-white/20 p-3.5 text-[14px] leading-snug text-[#cfd4de]">
                          <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#b9c0cc]">HubSpot: not yet</span>
                          <span>
                            Kicks in with {shownRule.when.charAt(0).toLowerCase() + shownRule.when.slice(1)}. {nowAt(shownRule.id, inp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center text-[17px] font-bold">
                    {simulator.emptyState}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p className="mt-5 text-[14.5px] text-night-dim">{simulator.honestyNote}</p>
      </div>
    </section>
  );
}

function nowAt(rule: string, inp: SimInputs) {
  const c = CONTROL_FOR[rule];
  if (!c) return '';
  const v = inp[c.k as keyof SimInputs];
  if (typeof v === 'boolean') return v ? '' : `Switch on “${c.label}” to see it.`;
  return `You're at ${v.toLocaleString('en-US')}.`;
}

/** The live readout inside each tile, so every control visibly moves something. */
function TileMeter({ rule, inp, lit }: { rule: string; inp: SimInputs; lit: boolean }) {
  const tone = lit ? 'text-white' : 'text-white/55';
  const Glyph = GLYPH[rule];
  if (Glyph) {
    const n = rule === 'brands' ? inp.brands : rule === 'access' ? inp.accessTeams : inp.linesOfBusiness;
    const shown = Math.min(n, 8);
    return (
      <span className="mt-1.5 flex h-5 items-center gap-[3px]" aria-hidden>
        <AnimatePresence initial={false}>
          {Array.from({ length: shown }, (_, i) => (
            <motion.span key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
              <Glyph size={14} className={tone} />
            </motion.span>
          ))}
        </AnimatePresence>
        {n > shown && <span className={`ml-0.5 text-[11.5px] font-extrabold tabular-nums ${tone}`}>+{n - shown}</span>}
      </span>
    );
  }
  if (rule === 'users' || rule === 'field') {
    const v = rule === 'users' ? inp.users : inp.technicians;
    const f = rule === 'users' ? Math.min(1, v / USER_CAP) : Math.min(1, v / 1000);
    return (
      <span className="mt-1.5 block" aria-hidden>
        <span className="flex items-baseline justify-between text-[11.5px] font-bold">
          <span className={`tabular-nums ${tone}`}>{v.toLocaleString('en-US')}</span>
          {rule === 'users' && <span className="text-white/45">cap {USER_CAP.toLocaleString('en-US')}</span>}
        </span>
        <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
          <span className={`block h-full rounded-full transition-[width] duration-300 ${lit ? 'bg-[#c3c9d4]' : 'bg-sf-cloud/70'}`} style={{ width: `${f * 100}%` }} />
        </span>
      </span>
    );
  }
  if (rule === 'ai') {
    const days = creditMath(inp.aiConversations, A).daysCovered;
    const cells = inp.aiConversations > 0 ? Math.min(A.daysPerMonth, days) : 0;
    return (
      <span className="mt-1.5 block" aria-hidden>
        <span className={`text-[11.5px] font-bold tabular-nums ${tone}`}>
          {inp.aiConversations > 0 ? `Credits last ${cells} of ${A.daysPerMonth} days` : 'No agents yet'}
        </span>
        <span className="mt-0.5 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-px">
          {Array.from({ length: A.daysPerMonth }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-[1px] transition-colors duration-300 ${i < cells ? 'bg-sf-cloud/80' : inp.aiConversations > 0 ? 'bg-[#5a606c]' : 'bg-white/10'}`} />
          ))}
        </span>
      </span>
    );
  }
  const c = CONTROL_FOR[rule];
  const on = c ? Boolean(inp[c.k as keyof SimInputs]) : false;
  return (
    <span className={`mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors ${on ? 'bg-white/15 text-white' : 'bg-white/[.06] text-white/45'}`} aria-hidden>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-sf-cloud' : 'bg-white/30'}`} /> {on ? 'On' : 'Off'}
    </span>
  );
}

function CalendarRow({ label, days, sf = false, note, source }: { label: string; days: boolean[]; sf?: boolean; note: string; source: string }) {
  return (
    <div>
      <p className={`text-[13px] font-extrabold uppercase tracking-[0.16em] ${sf ? 'text-sf-sky' : 'text-[#b9c0cc]'}`}>{label}</p>
      <div className="mt-1.5 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]" role="img" aria-label={`${label}: ${days.filter(Boolean).length} of ${days.length} days with agents running`}>
        {days.map((on, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ opacity: on ? 1 : 0.9, scale: on ? 1 : 0.86 }}
            className={`h-4 rounded-[3px] ${
              on ? (sf ? 'bg-gradient-to-b from-sf-cloud to-sf-electric shadow-[0_0_8px_rgba(0,179,255,.6)]' : 'bg-[#8a93a6]') : 'bg-[repeating-linear-gradient(45deg,#3a3f4b_0,#3a3f4b_3px,#2a2e37_3px,#2a2e37_6px)]'
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-[13px] leading-snug ${sf ? 'text-white' : 'text-[#cfd4de]'}`}>
        {note}
        <Footnote id={source} tone={sf ? 'dark' : 'gray'} />
      </p>
    </div>
  );
}
