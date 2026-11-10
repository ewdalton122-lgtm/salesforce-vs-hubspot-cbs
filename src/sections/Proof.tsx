import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { proof, site } from '../lib/content';
import { asset } from '../lib/env';
import { useApp } from '../context/AppContext';
import { Footnote, Reveal, SectionHead, StatValue } from '../components/ui';

type Cut = { id: 'ecre' | 'proserv' | 'fieldService' | 'customerService' | 'global'; tab: string; metrics: Array<[string, string, number]>; customers: number };

const csm = proof.customerSuccessMetrics;
const maxN = (m: Array<[string, string, number]>) => Math.max(...m.map((x) => x[2]));
const CUTS: Cut[] = [
  { id: 'ecre', tab: csm.industries[0].industry, metrics: csm.industries[0].metrics, customers: csm.industries[0].citationCustomers },
  { id: 'proserv', tab: csm.industries[1].industry, metrics: csm.industries[1].metrics, customers: csm.industries[1].citationCustomers },
  { id: 'fieldService', tab: csm.personas[0].label, metrics: csm.personas[0].metrics, customers: maxN(csm.personas[0].metrics) },
  { id: 'customerService', tab: csm.personas[1].label, metrics: csm.personas[1].metrics, customers: maxN(csm.personas[1].metrics) },
  { id: 'global', tab: 'All industries', metrics: csm.global, customers: maxN(csm.global) },
];

function Metrics() {
  const { industry } = useApp();
  const [cut, setCut] = useState<Cut['id']>(industry.csmDefault);
  useEffect(() => setCut(industry.csmDefault), [industry.csmDefault]);
  const c = CUTS.find((x) => x.id === cut)!;
  const [hero, ...rest] = c.metrics;

  return (
    <div className="mt-12">
      <div role="tablist" aria-label="Customer Success Metrics" className="flex flex-wrap gap-2">
        {CUTS.map((x) => (
          <button
            key={x.id}
            role="tab"
            type="button"
            aria-selected={cut === x.id}
            onClick={() => setCut(x.id)}
            className={`rounded-full px-4 py-2 text-[15px] font-bold transition-all ${
              cut === x.id ? 'bg-sf-blue text-white shadow-[0_10px_24px_rgba(1,118,211,.35)]' : 'bg-white text-ink ring-1 ring-[#cfe3fb] hover:ring-sf-blue'
            }`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cut}
          role="tabpanel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]"
        >
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-sf-electric to-sf-deep p-8 text-white shadow-[0_30px_80px_rgba(1,60,140,.35)]">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sf-cloud/40 blur-3xl" aria-hidden />
            <p className="relative text-[14px] font-extrabold uppercase tracking-[0.2em] text-sf-ice">{c.tab}</p>
            <p className="relative mt-4 text-[88px] font-extrabold leading-none tracking-tight sm:text-[110px]">
              <StatValue value={hero[0]} />
            </p>
            <p className="relative mt-3 text-[22px] font-bold">{hero[1]}</p>
            <p className="relative mt-2 text-[14px] text-sf-ice">n = {hero[2].toLocaleString('en-US')}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map(([v, label, n]) => (
              <li key={label} className="card-sf flex flex-col justify-between p-5">
                <p className="text-[40px] font-extrabold leading-none text-sf-blue">
                  <StatValue value={v} />
                </p>
                <p className="mt-3 text-[15.5px] font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{label.replace(/\//g, '/\u200b')}</p>
                <p className="mt-2 text-[12.5px] text-[#5b6b8a]">n = {n.toLocaleString('en-US')}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
      <p className="mt-5 max-w-[980px] text-[14px] leading-relaxed text-[#33415c]">
        {site.proof.csmCitation}
        <Footnote id={csm.source} tone="bright" />
      </p>
    </div>
  );
}

function Stories({ showHeading }: { showHeading: boolean }) {
  const { industry } = useApp();
  const ordered = useMemo(() => {
    const order = industry.storyOrder;
    return [...proof.stories].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [industry]);
  return (
    <div className={showHeading ? 'mt-20' : 'mt-12'}>
      {showHeading && <h3 className="mb-8 text-[28px] font-extrabold tracking-tight text-ink sm:text-[36px]">Services businesses already scaling on Salesforce.</h3>}
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((s, i) => (
          <motion.li
            key={s.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className="card-sf group flex flex-col overflow-hidden"
          >
            <div className="relative h-[170px] overflow-hidden">
              <img src={asset(s.image)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#032d60]/85 to-transparent" aria-hidden />
              <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-3 py-1 text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-sf-blue">{s.industry}</span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-[18px] font-bold leading-snug text-ink">
                {s.descriptor}
                <Footnote id={s.source} tone="bright" />
              </p>
              <ul className="mt-4 space-y-3">
                {s.stats.map((st) => (
                  <li key={st.label} className="flex items-baseline gap-3">
                    <span className="min-w-[92px] text-[28px] font-extrabold leading-none text-sf-blue">
                      <StatValue value={st.value} />
                    </span>
                    <span className="text-[15px] leading-snug text-[#33415c]">{st.label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                <ul className="flex flex-wrap gap-1.5">
                  {s.products.map((p) => (
                    <li key={p} className="rounded-full bg-[#eaf2fd] px-2.5 py-1 text-[12.5px] font-bold text-sf-blue">{p}</li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-[#e3ecf8] pt-3 text-[13px] text-[#5b6b8a]">
                  {site.proof.storyFooter}. {site.proof.storyCta}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function Proof() {
  const { flags } = useApp();
  return (
    <section id="proof" className="stage-bright py-28">
      <div className="wrap">
        <Reveal>
          {flags.showCsm ? (
            <SectionHead id="proof-title" tone="bright" kicker={site.proof.kicker} title={site.proof.title} accent={site.proof.titleAccent} />
          ) : (
            <SectionHead id="proof-title" tone="bright" kicker={site.proof.kicker} title={site.proof.socialTitle} />
          )}
        </Reveal>
        {flags.showCsm && <Metrics />}
        <Stories showHeading={flags.showCsm} />
      </div>
    </section>
  );
}
