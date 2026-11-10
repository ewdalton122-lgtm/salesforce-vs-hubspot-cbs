import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Pause, Phone, Play, RotateCcw } from 'lucide-react';
import { journey } from '../lib/content';
import { computeHandoffs, computeSystems, tallyUpTo } from '../lib/journey';
import { useApp } from '../context/AppContext';
import { Footnote, HsPill } from '../components/ui';

const STEP_MS = 2200;
const steps = journey.steps;
const totalSystems = computeSystems(steps).length;
const totalHandoffs = computeHandoffs(steps);

export default function FollowTheCall() {
  const { industry } = useApp();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState(reduce ? steps.length - 1 : -1);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (inView && !started.current && !reduce) {
      started.current = true;
      setStep(0);
      setPlaying(true);
    }
  }, [inView, reduce]);

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step]);

  const tally = step >= 0 ? tallyUpTo(steps, step) : { systems: 0, handoffs: 0 };
  const scenario = (journey.scenarios as Record<string, string>)[industry.id] ?? journey.scenarios.all;
  const done = step >= steps.length - 1;

  return (
    <div ref={ref} className="glass-strong mx-auto mt-10 max-w-[1180px] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <p className="kicker-dark">Follow the call</p>
          <h4 className="mt-2 flex items-center gap-3 text-[24px] font-extrabold leading-tight sm:text-[30px]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sf-cloud text-[#020818]">
              <Phone size={18} aria-hidden />
            </span>
            {scenario}
          </h4>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost !px-4 !py-2"
            onClick={() => {
              if (done) setStep(0);
              setPlaying((p) => !p || done);
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
            {playing ? 'Pause' : done ? 'Replay' : 'Play'}
          </button>
          <button type="button" className="btn-ghost !px-3 !py-2" onClick={() => (setPlaying(false), setStep(-1))} aria-label="Reset">
            <RotateCcw size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-[640px] sm:grid-cols-4">
        <Stat label="Salesforce platforms" value={step >= 0 ? 1 : 0} sf />
        <Stat label="Salesforce handoffs" value={0} sf />
        <Stat label="HubSpot systems" value={tally.systems} />
        <Stat label="HubSpot handoffs" value={tally.handoffs} />
      </div>

      <ol className="mt-6 space-y-2">
        {steps.map((s, i) => {
          const on = i <= step;
          const current = i === step;
          const changed = i > 0 && s.hubspot.system !== steps[i - 1].hubspot.system;
          return (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => (setPlaying(false), setStep(i))}
                aria-current={current ? 'step' : undefined}
                className={`grid w-full gap-2 rounded-2xl p-3 text-left transition-all md:grid-cols-[200px_1fr_1fr] md:items-center md:gap-4 ${
                  current ? 'bg-white/[.10] ring-2 ring-sf-cloud/70' : on ? 'bg-white/[.05]' : 'bg-transparent opacity-45 hover:opacity-80'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-extrabold ${on ? 'bg-sf-cloud text-[#020818]' : 'bg-white/10'}`}>{s.n}</span>
                  <span className="text-[15.5px] font-bold leading-snug">{s.title}</span>
                </span>
                <span className="relative rounded-xl bg-gradient-to-r from-sf-electric/50 to-sf-blue/40 px-3 py-2 text-[14.5px] ring-1 ring-sf-cloud/40">
                  <strong className="text-white">{s.salesforce.product}.</strong> <span className="text-white/90">{s.salesforce.text}</span>
                  <Footnote id={s.salesforce.source} />
                </span>
                <span className={`relative rounded-xl px-3 py-2 text-[14.5px] ring-1 ${s.hubspot.status === 'native' ? 'bg-white/[.07] ring-white/15' : 'bg-[#3d424e] ring-white/10'}`}>
                  {changed && on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2.5 right-3 rounded-full bg-[#8a93a6] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1c1f26]"
                    >
                      Handoff
                    </motion.span>
                  )}
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#b9c0cc]">{s.hubspot.system}</span>
                    <HsPill kind={s.hubspot.status === 'integration' ? 'customBuild' : s.hubspot.status} onDark />
                  </span>
                  <span className="text-[#cfd4de]">{s.hubspot.text}</span>
                  <Footnote id={s.hubspot.source} tone="gray" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-[17px] font-bold" aria-live="polite">
        {done
          ? `One platform, end to end with Salesforce. ${totalSystems} systems and ${totalHandoffs} handoffs on the HubSpot path.`
          : 'Same call, two paths. Watch where the HubSpot path changes systems.'}
      </p>
    </div>
  );
}

function Stat({ label, value, sf = false }: { label: string; value: number; sf?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${sf ? 'bg-sf-electric/25 ring-1 ring-sf-cloud/40' : 'bg-white/[.06] ring-1 ring-white/10'}`}>
      <motion.p key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-[30px] font-extrabold tabular-nums ${sf ? 'text-white' : 'text-[#e6e9ef]'}`}>
        {value}
      </motion.p>
      <p className={`text-[12.5px] font-bold ${sf ? 'text-sf-sky' : 'text-[#b9c0cc]'}`}>{label}</p>
    </div>
  );
}
