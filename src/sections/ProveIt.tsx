import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FlaskConical, Printer, RotateCw } from 'lucide-react';
import { demoPaths, questions } from '../lib/content';
import { Footnote, Reveal, SectionHead, SfLogo } from '../components/ui';

function AskCard({ q }: { q: (typeof questions.videoAsks)[number] }) {
  const [flipped, setFlipped] = useState(false);
  const path = demoPaths[String(q.n)] ?? [];
  return (
    <div className="flip h-[460px]" data-flipped={flipped}>
      <div className="flip-inner relative h-full w-full">
        <div className="flip-face flip-front absolute inset-0 flex flex-col rounded-card bg-[#3a3f4b] p-7 text-[#e6e9ef] ring-1 ring-white/10">
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
          <button type="button" onClick={() => setFlipped(true)} className="btn-primary mt-auto self-start" aria-label={`Then ask us: ${q.askHubSpot}`}>
            Then ask us <RotateCw size={16} aria-hidden />
          </button>
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
          <button type="button" onClick={() => setFlipped(false)} className="btn-ghost mt-auto self-start !py-2" tabIndex={flipped ? 0 : -1}>
            <RotateCw size={15} aria-hidden /> Back to the question
          </button>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="card-sf overflow-hidden !rounded-2xl">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-[17px] font-bold text-ink">{title}</span>
        <ChevronDown size={20} className={`shrink-0 text-sf-blue transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div className="border-t border-[#e3ecf8] px-5 py-4">{children}</div>}
    </li>
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
            <ul className="mt-4 space-y-2">
              {questions.topics.map((t) => (
                <Accordion key={t.id} title={t.topic}>
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-hs-text">Ask HubSpot</p>
                  <p className="mt-1 text-[16px] text-[#33415c]">{t.askHubSpot}</p>
                  <p className="mt-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-sf-blue">Salesforce</p>
                  <p className="mt-1 text-[16px] font-semibold text-ink">{t.salesforce}</p>
                </Accordion>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[24px] font-extrabold">More questions to ask</h3>
            <ul className="mt-4 space-y-2">
              {questions.moreQuestions.map((m) => (
                <Accordion key={m.topic} title={m.topic}>
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-hs-text">Ask HubSpot</p>
                  <p className="mt-1 text-[16px] text-[#33415c]">{m.askHubSpot}</p>
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
