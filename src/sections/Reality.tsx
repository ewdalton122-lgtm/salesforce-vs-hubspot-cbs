import { motion, useReducedMotion } from 'framer-motion';
import { GitMerge, Truck, PhoneCall, Receipt, Building2 } from 'lucide-react';
import { industries, site } from '../lib/content';
import { asset } from '../lib/env';
import { useApp } from '../context/AppContext';
import { SectionHead } from '../components/ui';
import { INDUSTRY_ICONS } from '../components/icons';

const PRESSURE_ICONS = [GitMerge, Truck, PhoneCall, Receipt];

export default function Reality() {
  const { industry, setIndustry } = useApp();
  const reduce = useReducedMotion();
  const pickable = industries.filter((i) => i.id !== 'all');
  return (
    <section id="reality" className="stage-dark relative overflow-hidden py-24">
      <div className="wrap">
        <SectionHead kicker={site.reality.kicker} title={site.reality.title} accent={site.reality.titleAccent} sub={site.reality.body} />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {site.reality.pressures.map((p, i) => {
            const Icon = PRESSURE_ICONS[i];
            return (
              <div key={p} className="glass flex items-center gap-4 !rounded-2xl p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-sf-sky">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="text-[18px] font-bold">{p}</span>
              </div>
            );
          })}
        </div>

        <h3 className="mt-16 text-[24px] font-extrabold tracking-tight sm:text-[30px]">{site.reality.pick}</h3>
        <div role="group" aria-label="Choose your industry" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {pickable.map((ind, i) => {
            const active = industry.id === ind.id;
            const Icon = INDUSTRY_ICONS[ind.icon] ?? Building2;
            return (
              <motion.button
                key={ind.id}
                type="button"
                aria-pressed={active}
                onClick={() => setIndustry(active ? 'all' : ind.id)}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`group relative h-[150px] overflow-hidden rounded-2xl text-left ring-2 transition-all sm:h-[180px] ${
                  active ? 'ring-sf-cloud shadow-[0_0_0_6px_rgba(0,179,255,.18),0_20px_50px_rgba(6,106,254,.35)]' : 'ring-white/10 hover:ring-white/40'
                }`}
              >
                <img
                  src={asset(`assets/images/cbs/${ind.photo}`)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'saturate(.88) contrast(1.06)' }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#020818] via-[#020818]/70 to-[#020818]/10" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <span className="text-[16px] font-bold leading-snug sm:text-[17px]">{ind.label}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? 'bg-sf-cloud text-[#020818]' : 'bg-white/15'}`}>
                    <Icon size={18} aria-hidden />
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-6 text-[18px] text-night-dim" aria-live="polite">
          <strong className="text-white">{industry.id === 'all' ? 'All services businesses: ' : `${industry.label}: `}</strong>
          {industry.fit}
        </p>

        <p className="mt-14 text-[30px] font-extrabold tracking-tight sm:text-[40px]">
          {site.reality.closing} <span className="grad-text">{site.reality.closingAccent}</span>
        </p>
      </div>
    </section>
  );
}
