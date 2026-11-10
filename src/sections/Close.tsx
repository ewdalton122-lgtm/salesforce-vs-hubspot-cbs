import { Link } from 'react-router-dom';
import { CalendarDays, Mail, Phone, PlayCircle, Printer } from 'lucide-react';
import { site } from '../lib/content';
import { asset, sellerFor, track } from '../lib/env';
import { useApp } from '../context/AppContext';

export default function Close() {
  const { flags } = useApp();
  const s = sellerFor(flags.sellerKey);
  const hasSeller = Boolean(s.name);
  return (
    <section id="contact" className="stage-dark relative overflow-hidden py-32">
      <div className="streak" aria-hidden />
      <img src={asset('assets/images/brand/astro.png')} alt="" aria-hidden className="bob pointer-events-none absolute bottom-10 right-[6%] hidden w-[170px] lg:block" />
      <div className="wrap relative text-center">
        <h2 id="contact-title" tabIndex={-1} className="h-display mx-auto max-w-[1100px] text-[48px] outline-none sm:text-[76px] lg:text-[96px]">
          {site.close.title} <span className="grad-text">{site.close.titleAccent}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[720px] text-[20px] text-night-dim sm:text-[23px]">{site.close.sub}</p>

        <div className={`mx-auto mt-12 max-w-[640px] text-left ${hasSeller ? 'glass-strong p-7' : ''}`}>
          {hasSeller ? (
            <>
              <p className="text-[24px] font-extrabold">{s.name}</p>
              {s.title && <p className="text-[16px] text-night-dim">{s.title}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {s.meetingUrl && (
                  <a className="btn-primary" href={s.meetingUrl} target="_blank" rel="noreferrer" onClick={() => track('cta_meeting')}>
                    <CalendarDays size={17} aria-hidden /> Book time
                  </a>
                )}
                {s.email && (
                  <a className="btn-ghost" href={`mailto:${s.email}`} onClick={() => track('cta_email')}>
                    <Mail size={17} aria-hidden /> {s.email}
                  </a>
                )}
                {s.phone && (
                  <a className="btn-ghost" href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}>
                    <Phone size={17} aria-hidden /> {s.phone}
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/checklist" className="btn-primary">
                <Printer size={17} aria-hidden /> Take the 5-check checklist to your demos
              </Link>
              <button type="button" className="btn-ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <PlayCircle size={17} aria-hidden /> Watch the video again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
