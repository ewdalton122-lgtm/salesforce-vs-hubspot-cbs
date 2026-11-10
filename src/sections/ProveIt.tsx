import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, FlaskConical, Gauge, Headphones, KeyRound, Plug, Printer, RotateCw, TrendingUp, type LucideIcon } from 'lucide-react';
import { demoPaths, questions } from '../lib/content';
import { Footnote, Reveal, SectionHead, SfLogo } from '../components/ui';
import { CHECK_ICONS } from './Intro';

const MORE_ICONS: Record<string, LucideIcon> = { Integration: Plug, Permissions: KeyRound, 'AI credits': Gauge, 'Contact center': Headphones, 'Pricing stability': TrendingUp };

function AskCard({ q }: { q: (typeof questions.videoAsks)[number] }) {
  const [flipped, setFlipped] = useState(false);
  const path = demoPaths[String(q.n)] ?? [];
  return (
    <div className="flip h-full" data-flipped={flipped}>
      <div className="flip-inner h-full min-h-[460px] w-full">
        <div className="flip-face flip-front flex flex-col rounded-card bg-[#3a3f4b] p-7 text-[#e6e9ef] ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[60px] font-extrabold leading-none text-white/25">{q.n}</span>
            {q.poc && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider">
                <FlaskConical size={13} aria-hidden /> Ask for a proof of concept
              </span>
            )}
          </div>
          <p className="mt-6 text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#b9c0cc]">Ask HubSpot</p>
          <p className="mt-2 text-[28px] font-extrabold leading-tight text-white">{q.askHubSpot}</p>
          <p className="mt-4 text-[16px] leading-relaxed text-[#cfd4de]">{q.full}</p>
          <div className="mt-auto pt-6">
            <button type="button" onClick={() => setFlipped(true)} className="btn-primary" aria-label={`Then ask us: ${q.askHubSpot}`}>
              Then ask us <RotateCw size={16} aria-hidden />
            </button>
          </div>
        </div>
        <div className="flip-face flip-back flex flex-col rounded-card bg-gradient-to-br from-sf-electric to-sf-deep p-7 text-white shadow-[0_30px_80px_rgba(6,106,254,.4)]" aria-hidden={!flipped}>
          <SfLogo className="h-9 self-start" />
          <p className="mt-5 text-[22px] font-extrabold leading-snug">{q.salesforce}</p>
          <p className="mt-5 text-[13px] font-extrabold uppercase tracking-[0.18em] text-sf-ice">What we'll show you live</p>
          <ol className="mt-3 space-y-2.5">
            {path.map((d, i) => (
              <li key={d.text} className="flex gap-3 text-[15.5px] leading-snug">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-extrabold text-sf-blue">{i + 1}</span>
                <span>
                  {d.text}
                  <Footnote id={d.source} />
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-6">
            <button type="button" onClick={() => setFlipped(false)} className="btn-ghost !py-2" tabIndex={flipped ? 0 : -1}>
              <RotateCw size={15} aria-hidden /> Back to the question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, icon: Icon, index, children }: { title: string; icon: LucideIcon; index: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={`ask-row group ${open ? 'is-open' : ''}`}
    >
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="relative flex w-full items-center gap-4 px-4 py-3.5 text-left sm:px-5">
        <span className="ask-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl">
          <Icon size={19} aria-hidden />
        </span>
        <span className="flex-1 text-[17px] font-bold text-white">{title}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sf-sky transition-transform duration-300 group-hover:bg-white/15 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} aria-hidden />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-5 sm:px-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function AskHubSpot({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[.06] p-4 ring-1 ring-white/10">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#b9c0cc]">Ask HubSpot</p>
      <p className="mt-1.5 text-[16px] leading-relaxed text-[#dfe3ea]">{children}</p>
    </div>
  );
}

export default function ProveIt() {
  return (
    <section id="prove-it" className="stage-dark relative overflow-hidden py-28">
      <div className="wrap relative">
        <Reveal>
          <SectionHead id="prove-it-title" kicker="Prove it" title={questions.title.split('?')[0] + '?'} accent={questions.title.split('?').slice(1).join('?').trim()} sub={questions.subtitle} />
        </Reveal>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[15px] font-bold ring-1 ring-white/15">
          <FlaskConical size={16} className="text-sf-sky" aria-hidden /> {questions.framing}
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {questions.videoAsks.map((q) => (
            <AskCard key={q.n} q={q} />
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-[24px] font-extrabold">The five checks, as questions</h3>
            <ul className="mt-4 space-y-2.5">
              {questions.topics.map((t, i) => (
                <Accordion key={t.id} title={t.topic} icon={CHECK_ICONS[i]} index={i}>
                  <AskHubSpot>{t.askHubSpot}</AskHubSpot>
                  <div className="rounded-xl bg-gradient-to-br from-sf-electric/35 to-sf-deep/50 p-4 ring-1 ring-sf-cloud/40">
                    <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-sf-cloud text-[#020818]">
                        <Check size={13} strokeWidth={3} aria-hidden />
                      </span>
                      Salesforce
                    </p>
                    <p className="mt-1.5 text-[16px] font-semibold leading-relaxed text-white">{t.salesforce}</p>
                  </div>
                </Accordion>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[24px] font-extrabold">More questions to ask</h3>
            <ul className="mt-4 space-y-2.5">
              {questions.moreQuestions.map((m, i) => (
                <Accordion key={m.topic} title={m.topic} icon={MORE_ICONS[m.topic] ?? Plug} index={i}>
                  <AskHubSpot>{m.askHubSpot}</AskHubSpot>
                </Accordion>
              ))}
            </ul>
            <Link to="/checklist" className="btn-primary mt-6">
              <Printer size={17} aria-hidden /> Printable evaluation checklist
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
