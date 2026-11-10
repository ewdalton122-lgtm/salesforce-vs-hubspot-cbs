import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { checks, questions, site } from '../lib/content';
import { SfLogo } from '../components/ui';

export default function Checklist() {
  useEffect(() => {
    document.title = `Evaluation checklist | ${site.banner.title}`;
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-[#e3ecf8] bg-white/95 px-5 py-3 backdrop-blur">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-bold text-sf-blue">
          <ArrowLeft size={16} aria-hidden /> Back to the site
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary !py-2">
          <Printer size={16} aria-hidden /> Print or save as PDF
        </button>
      </div>

      <main className="mx-auto max-w-[860px] px-6 py-12 print:py-0">
        <div className="flex items-center justify-between">
          <SfLogo className="h-10" />
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#5b6b8a]">CRM evaluation checklist</p>
        </div>
        <h1 className="mt-8 text-[40px] font-extrabold leading-tight tracking-tight">Five checks before you choose a CRM.</h1>
        <p className="mt-3 text-[18px] text-[#33415c]">{questions.subtitle} Bring this to every vendor demo, and ask each one to show it live, with your data.</p>

        <ol className="mt-10 space-y-6">
          {questions.topics.map((t, i) => (
            <li key={t.id} className="break-inside-avoid rounded-2xl border border-[#cfe3fb] p-6">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-sf-blue">Check {i + 1}</p>
              <h2 className="mt-1 text-[22px] font-extrabold">
                {checks.checks[i].title} {checks.checks[i].titleAccent}
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed">{t.askHubSpot}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-[14px] font-bold text-[#33415c]">
                {['Shown live', 'Needs a higher tier', 'Needs a separate app or build'].map((l) => (
                  <label key={l} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 accent-[#0176d3]" /> {l}
                  </label>
                ))}
              </div>
              <div className="mt-4 h-16 rounded-lg border border-dashed border-[#cfe3fb]" aria-label="Notes" />
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-[24px] font-extrabold">More questions</h2>
        <ul className="mt-4 space-y-3">
          {questions.moreQuestions.map((m) => (
            <li key={m.topic} className="flex gap-3 text-[16px]">
              <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-[#0176d3]" aria-label={m.topic} />
              <span>
                <strong>{m.topic}.</strong> {m.askHubSpot}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-12 border-t border-[#e3ecf8] pt-6 text-[12.5px] leading-relaxed text-[#5b6b8a]">
          {site.legal.disclaimer} {site.legal.trademark} {site.legal.copyright}
        </p>
      </main>
    </div>
  );
}
