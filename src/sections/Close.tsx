import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Mail, Phone, PlayCircle, Printer, Users } from 'lucide-react';
import { site, team } from '../lib/content';
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

        <div className={`mx-auto mt-12 ${hasSeller ? 'glass-strong max-w-[640px] p-7 text-left' : 'max-w-[860px]'}`}>
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
            <>
              <Link
                to="/team"
                onClick={() => track('cta_team')}
                className="group mx-auto flex w-fit max-w-full items-center gap-4 rounded-full bg-white/[.07] py-2 pl-2 pr-5 ring-1 ring-white/15 transition hover:bg-white/[.12] hover:ring-sf-sky/60"
              >
                <span className="flex shrink-0 -space-x-3">
                  {team.contacts.map((c) => (
                    <span key={c.email} className="team-ring team-ring-sm relative grid h-12 w-12 place-items-center rounded-full">
                      <img src={asset(c.photo)} alt="" className="h-full w-full rounded-full bg-white object-cover" />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 text-left leading-tight">
                  <span className="block text-[15px] font-extrabold">{team.contacts.map((c) => c.name).join(' & ')}</span>
                  <span className="hidden text-[13px] text-night-dim sm:block">{team.contacts.map((c) => c.role).join(' · ')}</span>
                  <span className="block text-[13px] text-night-dim sm:hidden">{team.kicker}</span>
                </span>
                <ArrowRight size={18} aria-hidden className="shrink-0 text-sf-sky transition group-hover:translate-x-1" />
              </Link>
              <div className="mx-auto mt-6 grid gap-3 sm:grid-cols-2">
                <Link to="/team" className="btn-primary justify-center" onClick={() => track('cta_team')}>
                  <Users size={17} aria-hidden /> Meet your Salesforce team
                </Link>
                <a className="btn-ghost justify-center" href={team.salesforce.url} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_salesforce_contact')}>
                  {team.salesforce.label} <ArrowUpRight size={17} aria-hidden />
                </a>
                <Link to="/checklist" className="btn-primary justify-center">
                  <Printer size={17} aria-hidden /> Take the 5-check checklist to your demos
                </Link>
                <button type="button" className="btn-ghost justify-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <PlayCircle size={17} aria-hidden /> Watch the video again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
