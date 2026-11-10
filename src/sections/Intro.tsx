import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Share2, Layers, Activity, ShieldCheck, Cpu, ArrowRight, FileText } from 'lucide-react';
import { checks, site } from '../lib/content';
import { asset } from '../lib/env';
import { scrollToId } from '../lib/scroll';
import { useApp } from '../context/AppContext';
import Transcript from '../components/Transcript';

export const CHECK_ICONS = [Share2, Layers, Activity, ShieldCheck, Cpu];

export default function Intro() {
  const reduce = useReducedMotion();
  const { flags } = useApp();
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <section id="intro" className="stage-dark relative overflow-hidden pb-24 pt-20 sm:pt-28">
      <div className="grain" aria-hidden />
      <img src={asset('assets/images/brand/agentforce-3d.png')} alt="" aria-hidden className="float-slow pointer-events-none absolute -right-10 top-24 hidden w-[190px] opacity-90 xl:block" />
      <div className="wrap relative">
        <p className="kicker-dark">{site.hero.kicker}</p>
        <h1 className="h-display mt-5 max-w-[1100px] text-[46px] sm:text-[72px] lg:text-[96px]">
          {site.hero.title} <span className="grad-text">{site.hero.titleAccent}</span>
        </h1>
        <p className="mt-6 max-w-[760px] text-[19px] leading-relaxed text-night-dim sm:text-[22px]">{site.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => scrollToId('reality')}>
            {site.hero.primary} <ArrowRight size={18} aria-hidden />
          </button>
          <button type="button" className="btn-ghost" onClick={() => scrollToId('prove-it')}>
            {site.hero.secondary}
          </button>
          <button type="button" className="btn-ghost" aria-expanded={showTranscript} onClick={() => setShowTranscript((s) => !s)}>
            <FileText size={18} aria-hidden /> Read the transcript
          </button>
        </div>
        {showTranscript && <Transcript social={flags.social} />}

        <div className="mt-16">
          <p className="kicker-dark">
            Before you choose a CRM <span className="ml-2 text-[22px] font-extrabold normal-case tracking-tight text-white sm:text-[26px]">run five checks.</span>
          </p>
          <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {checks.checks.map((c, i) => {
              const Icon = CHECK_ICONS[i];
              return (
                <motion.li
                  key={c.id}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => scrollToId(`act-${c.id}`)}
                    className="glass group relative flex h-full min-h-[150px] w-full flex-col justify-between overflow-hidden !rounded-2xl p-5 text-left transition-transform hover:-translate-y-1"
                  >
                    <span className="flex items-start justify-between">
                      <span className="text-[40px] font-extrabold leading-none">{c.number}</span>
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#1b96ff] to-[#0176d3] shadow-[0_6px_20px_rgba(1,118,211,.5)]">
                        <Icon size={20} aria-hidden />
                      </span>
                    </span>
                    <span className="mt-6 text-[17px] font-bold leading-snug">
                      {c.title.replace(/,$/, '')} {c.titleAccent.replace(/\.$/, '')}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-sf-blue to-sf-cloud opacity-70 transition-opacity group-hover:opacity-100" aria-hidden />
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
