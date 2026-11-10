import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Link2, RotateCcw } from 'lucide-react';
import { simulator, type SimInputs } from '../lib/content';
import { decodeInputs, encodeInputs, evaluate } from '../lib/simulator';
import { creditCalendar } from '../lib/credits';
import { useApp } from '../context/AppContext';
import { Footnote, HsPill, SectionHead, SfTick } from '../components/ui';
import { track } from '../lib/env';

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

  return (
    <section id="build" className="stage-dark relative overflow-hidden py-28">
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[560px] w-[560px] rounded-full bg-sf-cloud/15 blur-[120px]" aria-hidden />
      <div className="wrap relative">
        <SectionHead
          id="build-title"
          kicker="Build your future"
          title="Size it to your business."
          accent="See what changes."
          sub={`Start from a typical ${industry.id === 'all' ? 'services business' : industry.short.toLowerCase() + ' business'}, then move anything.`}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="glass-strong h-fit p-6 lg:sticky lg:top-[calc(var(--banner-h)+20px)]">
            <form onSubmit={(e) => e.preventDefault()} aria-label="Your business" className="space-y-5">
              {SLIDERS.map(({ k, label, max, step }) => (
                <label key={k} className="block">
                  <span className="flex justify-between gap-3 text-[15px] font-bold">
                    {label}
                    <span className="tabular-nums text-sf-sky">{inp[k].toLocaleString('en-US')}</span>
                  </span>
                  <input
                    type="range"
                    className="range mt-2"
                    min={0}
                    max={max}
                    step={step}
                    value={Math.min(inp[k], max)}
                    style={{ ['--fill' as string]: `${(Math.min(inp[k], max) / max) * 100}%` }}
                    onChange={(e) => set(k, Number(e.target.value))}
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-2">
                {TOGGLES.map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={inp[k]}
                    onClick={() => set(k, !inp[k])}
                    className={`rounded-xl px-3 py-2.5 text-left text-[14px] font-bold leading-snug transition-all ${
                      inp[k] ? 'bg-sf-cloud text-[#020818] shadow-[0_0_20px_rgba(0,179,255,.35)]' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn-ghost !px-3 !py-2 !text-[14px]" onClick={() => setInp(industry.simulatorDefaults)}>
                  <RotateCcw size={14} aria-hidden /> Reset
                </button>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 !text-[14px]"
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

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card-sf-dark p-5">
                <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-white/85">Salesforce</p>
                <p className="mt-1 text-[28px] font-extrabold leading-tight">One platform</p>
                <p className="text-[15px] text-white/85">Every answer below lands on the same data and security model.</p>
              </div>
              <div className="card-hs-dark p-5">
                <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">HubSpot</p>
                <p className="mt-1 text-[28px] font-extrabold leading-tight text-[#e6e9ef]">
                  <span className="tabular-nums">{result.findings.length}</span> things to plan around
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(result.counts).map(([pill, n]) => (
                    <span key={pill} className="flex items-center gap-1">
                      <HsPill kind={pill} onDark />
                      <span className="text-[13px] font-bold tabular-nums text-[#e6e9ef]">×{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3" aria-live="polite">
              <AnimatePresence initial={false}>
                {result.findings.length === 0 && (
                  <motion.li key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass p-6 text-center text-[18px] font-bold">
                    {simulator.emptyState}
                  </motion.li>
                )}
                {result.findings.map((f) => (
                  <motion.li
                    key={f.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <div className="flex gap-3 rounded-2xl bg-gradient-to-r from-sf-electric/40 to-sf-blue/25 p-4 text-[15.5px] leading-snug ring-1 ring-sf-cloud/40">
                      <SfTick size={22} />
                      <span>
                        {f.salesforce.text}
                        <Footnote id={f.salesforce.source} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl bg-[#3a3f4b] p-4 text-[15px] leading-snug text-[#cfd4de] ring-1 ring-white/10">
                      <HsPill kind={f.hubspot.pill} onDark />
                      <span>
                        {f.hubspotText}
                        <Footnote id={f.hubspot.source} tone="gray" />
                      </span>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {inp.aiConversations > 0 && (
              <div className="glass-strong mt-6 p-6">
                <p className="text-[19px] font-extrabold">
                  A month of AI agents at {inp.aiConversations.toLocaleString('en-US')} conversations
                </p>
                <div className="mt-4 space-y-3">
                  <CalendarRow label="Salesforce" days={calendar.map(() => true)} sf note="Flex Credits: the whole contract term" source="sf-agentforce-pricing" />
                  <CalendarRow
                    label="HubSpot"
                    days={calendar}
                    note={result.credits.exceeds ? `Included credits cover about ${result.credits.daysCovered} days. Then agents pause unless you buy packs.` : 'Included credits cover the month at this volume.'}
                    source={simulator.assumptions.source}
                  />
                </div>
                <p className="mt-3 flex gap-2 text-[13px] text-night-dim">
                  <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {simulator.assumptions.tooltip}
                </p>
              </div>
            )}
            <p className="mt-5 text-[14.5px] text-night-dim">{simulator.honestyNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarRow({ label, days, sf = false, note, source }: { label: string; days: boolean[]; sf?: boolean; note: string; source: string }) {
  return (
    <div>
      <p className={`text-[13px] font-extrabold uppercase tracking-[0.16em] ${sf ? 'text-sf-sky' : 'text-[#b9c0cc]'}`}>{label}</p>
      <div className="mt-1.5 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]" role="img" aria-label={`${label}: ${days.filter(Boolean).length} of ${days.length} days with agents running`}>
        {days.map((on, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ opacity: on ? 1 : 0.9, scale: on ? 1 : 0.86 }}
            className={`h-6 rounded-[4px] sm:h-7 ${
              on ? (sf ? 'bg-gradient-to-b from-sf-cloud to-sf-electric shadow-[0_0_8px_rgba(0,179,255,.6)]' : 'bg-[#8a93a6]') : 'bg-[repeating-linear-gradient(45deg,#3a3f4b_0,#3a3f4b_3px,#2a2e37_3px,#2a2e37_6px)]'
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-[14px] ${sf ? 'text-white' : 'text-[#cfd4de]'}`}>
        {note}
        <Footnote id={source} tone={sf ? 'dark' : 'gray'} />
      </p>
    </div>
  );
}
