import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Info, Layers } from 'lucide-react';
import { cost, growth } from '../lib/content';
import { computeAll, tierJump, usd, type CalcInputs } from '../lib/calc';
import { growthCounts } from '../lib/growth';
import { Footnote, HsPill } from '../components/ui';
import { track } from '../lib/env';

const DISCLAIMER =
  'List prices, per user per month, billed annually, as of Nov 2026. Excludes discounts, partner services and third-party apps. Validate scope with your Salesforce account executive.';

function GrowthStack() {
  const [stage, setStage] = useState(growth.stages.length);
  const counts = growthCounts(growth.stages, stage);
  const fill = `${((stage - 1) / (growth.stages.length - 1)) * 100}%`;
  return (
    <div className="glass-strong p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker-dark">Grow it yourself</p>
          <h4 className="mt-2 text-[24px] font-extrabold sm:text-[30px]">Seven stages of growth. Count what you add.</h4>
        </div>
        <p className="text-[16px] text-night-dim">
          Stage {stage}: <strong className="text-white">{growth.stages[stage - 1].title}</strong>
        </p>
      </div>
      <label className="mt-6 block">
        <span className="sr-only">Growth stage</span>
        <input
          type="range"
          className="range"
          min={1}
          max={growth.stages.length}
          value={stage}
          style={{ ['--fill' as string]: fill }}
          onChange={(e) => setStage(Number(e.target.value))}
          aria-valuetext={`Stage ${stage}: ${growth.stages[stage - 1].title}`}
        />
      </label>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="flex items-center justify-between text-[14px] font-extrabold uppercase tracking-[0.16em] text-sf-sky">
            Salesforce <span className="normal-case tracking-normal text-white">{counts.salesforceTiles} capabilities, one platform</span>
          </p>
          <div className="mt-3 rounded-2xl bg-gradient-to-b from-sf-electric/30 to-sf-deep/40 p-3 ring-1 ring-sf-cloud/40">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <AnimatePresence initial={false}>
                {growth.stages.slice(0, stage).map((s) => (
                  <motion.div
                    key={s.stage}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-xl bg-white/[.12] px-3 py-2.5 text-[14.5px] font-bold leading-snug ring-1 ring-white/20"
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
              {growth.stages.slice(0, stage).flatMap((s) =>
                s.hubspot.map((b, j) => (
                  <motion.div
                    key={`${s.stage}-${j}`}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0, rotate: (((s.stage * 7 + j * 3) % 5) - 2) * 0.35 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#4a505d] px-3 py-2 text-[14px] font-semibold text-[#e6e9ef]"
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

function Calculator() {
  const [inp, setInp] = useState<CalcInputs>({
    salesSeats: cost.defaults.salesSeats,
    serviceSeats: cost.defaults.serviceSeats,
    years: cost.defaults.years,
    includeDataHub: cost.inputs.includeDataHub.default,
    includeSfApiAddon: cost.inputs.includeSfApiAddon.default,
  });
  const jump = useMemo(() => tierJump(cost.options), []);
  const results = useMemo(() => computeAll(cost.options, inp), [inp]);
  const ordered = useMemo(() => [...results].sort((a, b) => (a.vendor === b.vendor ? 0 : a.vendor === 'Salesforce' ? -1 : 1)), [results]);
  const max = Math.max(...results.map((r) => r.total));
  const set = <K extends keyof CalcInputs>(k: K, v: CalcInputs[K]) => {
    setInp((s) => ({ ...s, [k]: v }));
    track('calc_change', { field: k });
  };
  const notes = Object.fromEntries(cost.options.map((o) => [o.id, o.note]));
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Cost scenario">
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
          {(['includeDataHub', 'includeSfApiAddon'] as const).map((k) => (
            <label key={k} className="flex cursor-pointer items-start gap-3 text-[15px]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0176d3]" checked={inp[k]} onChange={(e) => set(k, e.target.checked)} />
              <span>
                {cost.inputs[k].label}
                <Footnote id={k === 'includeDataHub' ? 'hs-pricing-data' : 'sf-pricing-sales'} />
              </span>
            </label>
          ))}
        </form>

        <div>
          <ul className="space-y-3" aria-live="polite">
            {ordered.map((r) => {
              const sf = r.vendor === 'Salesforce';
              return (
                <li key={r.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className={`text-[15.5px] font-bold ${sf ? 'text-white' : 'text-[#cfd4de]'}`}>{r.label}</span>
                    <span className={`text-[20px] font-extrabold tabular-nums ${sf ? 'text-white' : 'text-[#e6e9ef]'}`}>
                      {usd(r.total)}
                      <span className="ml-1 text-[13px] font-semibold text-night-dim">/ {inp.years} yr</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/[.08]">
                    <motion.div
                      className={`h-full rounded-full ${sf ? 'bg-gradient-to-r from-sf-electric to-sf-cloud shadow-[0_0_16px_rgba(0,179,255,.6)]' : 'bg-[#7a8294]'}`}
                      animate={{ width: `${(r.total / max) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <p className="mt-1 text-[13px] text-night-dim">
                    {usd(r.annual)} a year{r.oneTime ? ` + ${usd(r.oneTime)} onboarding` : ''}
                    {notes[r.id] && !/allotment/i.test(notes[r.id] ?? '') ? ` · ${notes[r.id]}` : r.id === 'sf-core' ? ' · Includes 500K Flex Credits per org' : ''}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 flex gap-2 rounded-xl bg-white/5 px-4 py-3 text-[14px] text-[#d5e3f7] ring-1 ring-white/10">
            <Info size={16} className="mt-0.5 shrink-0 text-sf-sky" aria-hidden />
            <span>{DISCLAIMER}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <p className="text-[16px] font-extrabold">{cost.hiddenCosts.title}</p>
        <ul className="mt-3 grid gap-2 text-[15px] text-[#cfd4de] sm:grid-cols-2">
          {cost.hiddenCosts.items.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a93a6]" aria-hidden />
              {h}
            </li>
          ))}
        </ul>
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
