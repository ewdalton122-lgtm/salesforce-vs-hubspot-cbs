import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, Link2, RotateCcw, Sparkles } from 'lucide-react';
import { checks, simulator, type SimInputs } from '../lib/content';
import { decodeInputs, encodeInputs, evaluate } from '../lib/simulator';
import { creditCalendar } from '../lib/credits';
import { useApp } from '../context/AppContext';
import { Footnote, HsPill, SectionHead, SfTick } from '../components/ui';
import { track } from '../lib/env';
import { CHECK_ICONS } from './Intro';

const RULES = simulator.rules;
const iconFor = (check: string) => CHECK_ICONS[Math.max(0, checks.checks.findIndex((c) => c.id === check))];

type NumKey = 'brands' | 'locations' | 'users' | 'linesOfBusiness' | 'technicians' | 'aiConversations';
type BoolKey = 'erp' | 'dispatch' | 'phone' | 'warehouse';

const SLIDERS: Array<{ k: NumKey; label: string; max: number; step: number }> = [
  { k: 'brands', label: 'Brands or acquired companies', max: 20, step: 1 },
  { k: 'locations', label: 'Locations', max: 200, step: 1 },
  { k: 'users', label: 'CRM users', max: 5000, step: 25 },
  { k: 'linesOfBusiness', label: 'Lines of business', max: 10, step: 1 },
  { k: 'technicians', label: 'Field technicians', max: 1000, step: 5 },
  { k: 'aiConversations', label: 'AI agent conversations a month', max: 10000, step: 100 },
];
const TOGGLES: Array<{ k: BoolKey; label: string }> = [
  { k: 'phone', label: 'Customers call us' },
  { k: 'dispatch', label: 'We dispatch crews' },
  { k: 'erp', label: 'We bill from an ERP' },
  { k: 'warehouse', label: 'We have a data warehouse' },
];

export default function Build() {
  const { industry } = useApp();
  const [params, setParams] = useSearchParams();
  const [inp, setInp] = useState<SimInputs>(() => decodeInputs(params.toString(), industry.simulatorDefaults));
  const [copied, setCopied] = useState(false);
  const lastIndustry = useRef(industry.id);

  useEffect(() => {
    if (lastIndustry.current === industry.id) return;
    lastIndustry.current = industry.id;
    setInp(industry.simulatorDefaults);
  }, [industry]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      new URLSearchParams(encodeInputs(inp)).forEach((v, k) => next.set(k, v));
      if (next.toString() !== params.toString()) setParams(next, { replace: true, preventScrollReset: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inp]);

  const result = useMemo(() => evaluate(inp, simulator.rules, simulator.assumptions), [inp]);
  const calendar = creditCalendar(result.credits.daysCovered, simulator.assumptions.daysPerMonth);
  const set = <K extends keyof SimInputs>(k: K, v: SimInputs[K]) => {
    setInp((s) => ({ ...s, [k]: v }));
    track('sim_change', { field: k });
  };

  const hit = useMemo(() => new Map(result.findings.map((f) => [f.id, f])), [result]);
  const [picked, setPicked] = useState<string | null>(null);
  const prev = useRef<Set<string>>(new Set(hit.keys()));
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const added = [...hit.keys()].filter((id) => !prev.current.has(id));
    prev.current = new Set(hit.keys());
    if (added.length) {
      setFresh(added[added.length - 1]);
      setPicked(added[added.length - 1]);
    } else if (picked && !hit.has(picked)) setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit]);
  const shown = (picked && hit.get(picked)) || result.findings[result.findings.length - 1];
  const shownRule = shown && RULES.find((r) => r.id === shown.id);

  return (
    <section id="build" className="stage-dark relative overflow-clip py-28">
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[560px] w-[560px] rounded-full bg-sf-cloud/15 blur-[120px]" aria-hidden />
      <div className="wrap relative">
        <SectionHead
          id="build-title"
          kicker="Build your future"
          title="Size it to your business."
          accent="See what changes."
          sub={`Start from a typical ${industry.id === 'all' ? 'services business' : industry.short.toLowerCase() + ' business'}, then move anything.`}
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
              <form onSubmit={(e) => e.preventDefault()} aria-label="Your business" className="space-y-3">
                {SLIDERS.map(({ k, label, max, step }) => (
                  <label key={k} className="block">
                    <span className="flex justify-between gap-3 text-[13.5px] font-bold">
                      {label}
                      <span className="tabular-nums text-sf-sky">{inp[k].toLocaleString('en-US')}</span>
                    </span>
                    <input
                      type="range"
                      className="range mt-1"
                      min={0}
                      max={max}
                      step={step}
                      value={Math.min(inp[k], max)}
                      style={{ ['--fill' as string]: `${(Math.min(inp[k], max) / max) * 100}%` }}
                      onChange={(e) => set(k, Number(e.target.value))}
                    />
                  </label>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {TOGGLES.map(({ k, label }) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={inp[k]}
                      onClick={() => set(k, !inp[k])}
                      className={`rounded-xl px-3 py-1.5 text-left text-[13.5px] font-bold leading-snug transition-all ${
                        inp[k] ? 'bg-sf-cloud text-[#020818] shadow-[0_0_20px_rgba(0,179,255,.35)]' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost !px-3 !py-1.5 !text-[13.5px]" onClick={() => setInp(industry.simulatorDefaults)}>
                    <RotateCcw size={14} aria-hidden /> Reset
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 !text-[13.5px]"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      } catch {
                        /* clipboard unavailable */
                      }
                    }}
                  >
                    <Link2 size={14} aria-hidden /> {copied ? 'Link copied' : 'Copy link to this scenario'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-strong flex-1 px-5 py-4">
              <p className="flex items-center justify-between gap-2 text-[15.5px] font-extrabold">
                A month of AI agents
                <span className="group relative">
                  <button type="button" className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-sf-sky hover:bg-white/20" aria-label={`Assumptions: ${simulator.assumptions.tooltip}`}>
                    <Info size={14} aria-hidden />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-[280px] rounded-lg bg-[#020818] px-3 py-2 text-[12.5px] font-medium leading-snug text-white opacity-0 shadow-xl ring-1 ring-white/15 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    {simulator.assumptions.tooltip}
                  </span>
                </span>
              </p>
              {inp.aiConversations > 0 ? (
                <>
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
                      source={simulator.assumptions.source}
                    />
                  </div>
                </>
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
                <p className="text-[13.5px] text-white/85">Every need below lands on the same data and security model.</p>
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
                <div className="mt-2 flex flex-wrap gap-1.5">
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
                const sel = shown?.id === r.id;
                return (
                  <li key={r.id}>
                    <motion.button
                      type="button"
                      disabled={!f}
                      onClick={() => setPicked(r.id)}
                      aria-pressed={sel}
                      animate={f && fresh === r.id ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`flex h-full min-h-[90px] w-full flex-col rounded-2xl p-2.5 text-left transition-[background-color,box-shadow,opacity] duration-500 ${
                        f
                          ? `bg-[#3a3f4b] ${sel ? 'ring-2 ring-sf-cloud shadow-[0_0_28px_rgba(0,179,255,.3)]' : 'ring-1 ring-white/20 hover:ring-white/40'}`
                          : 'cursor-default border border-dashed border-white/20 bg-white/[.03] opacity-60'
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <Icon size={15} className={`mt-0.5 shrink-0 ${f ? 'text-white' : 'text-white/50'}`} aria-hidden />
                        <span className={`text-[13.5px] font-bold leading-snug ${f ? 'text-white' : 'text-white/70'}`}>{r.short}</span>
                      </span>
                      <span className="mt-auto space-y-1 pt-1.5">
                        <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-sf-sky">
                          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-sf-cloud text-[#020818]">
                            <Check size={9} strokeWidth={4} aria-hidden />
                          </span>
                          Salesforce: same platform
                        </span>
                        {f ? (
                          <span className="block">
                            <HsPill kind={r.hubspot.pill} onDark />
                          </span>
                        ) : (
                          <span className="block text-[11.5px] font-semibold text-white/45">Kicks in with {r.when.charAt(0).toLowerCase() + r.when.slice(1)}</span>
                        )}
                      </span>
                    </motion.button>
                  </li>
                );
              })}
            </ul>

            <div className="glass-strong flex-1 p-4 sm:p-5" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {shown && shownRule ? (
                  <motion.div key={shown.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="flex items-center gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
                        {fresh === shown.id && <Sparkles size={13} aria-hidden />} {shownRule.short}
                      </p>
                      {result.findings.length > 1 && <p className="text-[12.5px] text-night-dim">Tap any lit tile to compare it.</p>}
                    </div>
                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                      <div className="flex gap-2.5 rounded-xl bg-gradient-to-r from-sf-electric/40 to-sf-blue/25 p-3.5 text-[14.5px] leading-snug ring-1 ring-sf-cloud/40">
                        <SfTick size={20} />
                        <span>
                          {shown.salesforce.text}
                          <Footnote id={shown.salesforce.source} />
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 rounded-xl bg-[#3a3f4b] p-3.5 text-[14px] leading-snug text-[#cfd4de] ring-1 ring-white/10">
                        <HsPill kind={shown.hubspot.pill} onDark />
                        <span>
                          {shown.hubspotText}
                          <Footnote id={shown.hubspot.source} tone="gray" />
                        </span>
                      </div>
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
