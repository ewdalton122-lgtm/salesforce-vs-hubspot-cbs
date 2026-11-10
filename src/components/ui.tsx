import { motion, useInView, useReducedMotion } from 'framer-motion';
import { X, Check, Lock, Boxes, Plus, AlertTriangle, Wrench, FlaskConical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sources } from '../lib/content';
import { formatAsOf, isFootnotable } from '../lib/footnotes';
import { footnoteNumber } from '../lib/sourceOrder';
import { scrollToId } from '../lib/scroll';
import { asset } from '../lib/env';

export function Footnote({ id, tone = 'dark' }: { id: string; tone?: 'dark' | 'bright' | 'gray' }) {
  if (!isFootnotable(id)) return null;
  const n = footnoteNumber(id);
  const s = sources[id];
  if (!n || !s) return <sup className="ml-0.5 text-[11px] font-bold text-amber-300">[source pending]</sup>;
  const color =
    tone === 'bright'
      ? 'text-sf-blue/70 hover:text-sf-blue hover:bg-sf-blue/10'
      : tone === 'gray'
        ? 'text-current opacity-55 hover:opacity-100 hover:bg-white/10'
        : 'text-sf-sky/75 hover:text-sf-sky hover:bg-white/10';
  const tip = `${s.label}${s.asOf ? ` (as of ${formatAsOf(s.asOf)})` : ''}`;
  const go = () => scrollToId(`src-${id}`);
  // An inline span (not a button, which lays out as inline-block) so the marker never wraps away from its word.
  return (
    <sup className="group relative top-[-0.55em] ml-[2px] align-baseline text-[0.62em] leading-none">
      <span
        role="button"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
        className={`cursor-pointer rounded-[3px] px-[2px] font-semibold tabular-nums tracking-normal transition-colors focus-visible:outline focus-visible:outline-1 ${color}`}
        aria-label={`Source ${n}: ${tip}`}
      >
        {n}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[280px] -translate-x-1/2 rounded-lg bg-[#020818] px-3 py-2 text-left text-[13px] font-medium normal-case leading-snug tracking-normal text-white opacity-0 shadow-xl ring-1 ring-white/15 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {tip}
      </span>
    </sup>
  );
}

export function Reveal({ children, delay = 0, className = '', y = 30 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ value, suffix = '', prefix = '', duration = 1.4, decimals = 0 }: { value: number; suffix?: string; prefix?: string; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setV(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / (duration * 1000));
      setV(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);
  const final = `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{final}</span>
      <span aria-hidden>
        {prefix}
        {v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </span>
    </span>
  );
}

/** Parses a display value like "99%", "12 months", "4x", "82 trillion" into a counter when it's a simple number. */
export function StatValue({ value }: { value: string }) {
  const m = value.match(/^(\d+(?:\.\d+)?)(\s?(?:%|x|months|trillion|min)?)$/);
  if (!m) return <span className="tabular-nums">{value}</span>;
  return <Counter value={Number(m[1])} suffix={m[2]} decimals={m[1].includes('.') ? 1 : 0} />;
}

export function SectionHead({
  kicker, title, accent, sub, tone = 'dark', id, center = false,
}: { kicker: string; title: string; accent?: string; sub?: string; tone?: 'dark' | 'bright'; id?: string; center?: boolean }) {
  return (
    <div className={`max-w-[920px] ${center ? 'mx-auto text-center' : ''}`}>
      <p className={tone === 'dark' ? 'kicker-dark' : 'kicker-bright'}>{kicker}</p>
      <h2 id={id} tabIndex={-1} className={`h-section mt-4 outline-none ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>
        {title}{' '}
        {accent && <span className={tone === 'dark' ? 'grad-text' : 'text-sf-blue'}>{accent}</span>}
      </h2>
      {sub && <p className={`mt-5 text-[19px] leading-relaxed sm:text-[21px] ${tone === 'dark' ? 'text-night-dim' : 'text-[#33415c]'}`}>{sub}</p>}
    </div>
  );
}

export function FallsShort() {
  return (
    <span className="pill-falls">
      <X size={13} strokeWidth={3} aria-hidden /> Falls short
    </span>
  );
}

const PILL: Record<string, { label: string; Icon: typeof Lock }> = {
  topTier: { label: 'Top tier only', Icon: Lock },
  gate: { label: 'Top tier only', Icon: Lock },
  limit: { label: 'Limit', Icon: AlertTriangle },
  beta: { label: 'Beta', Icon: FlaskConical },
  app: { label: 'Separate app', Icon: Boxes },
  customBuild: { label: 'Custom build', Icon: Wrench },
  integration: { label: 'Custom build', Icon: Wrench },
  fee: { label: 'Added fee', Icon: Plus },
  addon: { label: 'Add-on', Icon: Plus },
  native: { label: 'Native', Icon: Check },
};

export function HsPill({ kind, onDark = false }: { kind: string | null | undefined; onDark?: boolean }) {
  if (!kind || !PILL[kind]) return null;
  const { label, Icon } = PILL[kind];
  const native = kind === 'native';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
        native
          ? onDark ? 'bg-white/15 text-white' : 'bg-white text-hs-text ring-1 ring-hs-line'
          : onDark ? 'bg-white/10 text-[#d5dae4] ring-1 ring-white/20' : 'bg-hs-chip text-hs-text'
      }`}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden /> {label}
    </span>
  );
}

export function SfTick({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full text-white"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#1b96ff,#0176d3)', boxShadow: '0 4px 12px rgba(1,118,211,.45)' }}
      aria-hidden
    >
      <Check size={size * 0.6} strokeWidth={3.4} />
    </span>
  );
}

export function HsMark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-hs-chip text-hs-text" style={{ width: size, height: size }} aria-hidden>
      <X size={size * 0.55} strokeWidth={3} />
    </span>
  );
}

export function SfLogo({ className = 'h-8' }: { className?: string }) {
  return <img src={asset('assets/images/brand/sf-logo.png')} alt="Salesforce" className={`${className} w-auto`} />;
}
