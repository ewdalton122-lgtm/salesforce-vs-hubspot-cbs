import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Mail, Users } from 'lucide-react';
import { mailto, site, team } from '../lib/content';
import { asset, track } from '../lib/env';
import { SfLogo } from '../components/ui';

export default function Team() {
  const reduce = useReducedMotion();
  useEffect(() => {
    document.title = `Your Salesforce team | ${site.banner.title}`;
    window.scrollTo(0, 0);
  }, []);
  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="stage-dark relative min-h-screen overflow-clip text-white">
      <div className="streak" aria-hidden />
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-sf-electric/25 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-sf-cloud/15 blur-[120px]" aria-hidden />

      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[15px] font-bold ring-1 ring-white/15 hover:bg-white/20">
          <ArrowLeft size={16} aria-hidden /> Back to the site
        </Link>
        <SfLogo className="h-9" />
      </header>

      <main id="main" className="wrap relative pb-24 pt-10 sm:pt-16">
        <motion.div {...rise(0)} className="mx-auto max-w-[980px] text-center">
          <p className="kicker-dark">{team.kicker}</p>
          <h1 className="h-section mt-4">
            {team.title} <span className="grad-text block">{team.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[680px] text-[19px] leading-relaxed text-night-dim sm:text-[21px]">{team.sub}</p>
        </motion.div>

        <ul className="mx-auto mt-14 grid max-w-[980px] gap-6 md:grid-cols-2">
          {team.contacts.map((c, i) => (
            <motion.li key={c.email} {...rise(i + 1)} className="glass-strong flex flex-col items-center p-8 text-center">
              <div className="team-ring relative grid h-[164px] w-[164px] place-items-center rounded-full p-[5px]">
                <img src={asset(c.photo)} alt={c.name} width={154} height={154} className="h-full w-full rounded-full bg-white object-cover" />
              </div>
              <h2 className="mt-6 text-[28px] font-extrabold leading-tight">{c.name}</h2>
              <p className="mt-1 text-[16px] font-bold text-sf-sky">{c.role}</p>
              <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white/60">Salesforce</p>
              <p className="mt-4 max-w-[360px] text-[16px] leading-relaxed text-night-dim">{c.focus}</p>
              <div className="mt-auto flex flex-col items-center pt-6">
                <a className="btn-primary" href={mailto([c.email])} onClick={() => track('cta_email', { who: c.first })}>
                  <Mail size={17} aria-hidden /> Email {c.first}
                </a>
                <a className="mt-3 text-[15px] font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline" href={mailto([c.email])}>
                  {c.email}
                </a>
              </div>
            </motion.li>
          ))}
        </ul>

        <motion.div {...rise(3)} className="mx-auto mt-6 grid max-w-[980px] gap-6 md:grid-cols-2">
          <div className="flex flex-col items-start rounded-card bg-white/[.06] p-7 ring-1 ring-white/15">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">
              <Users size={15} aria-hidden /> One email, both of us
            </p>
            <p className="mt-2 text-[16px] text-night-dim">Bring the solutions engineer and the sales leader into the same conversation.</p>
            <a className="btn-ghost mt-5" href={mailto(team.contacts.map((c) => c.email))} onClick={() => track('cta_email', { who: 'both' })}>
              <Mail size={17} aria-hidden /> Email both of us
            </a>
          </div>
          <div className="flex flex-col items-start rounded-card bg-white/[.06] p-7 ring-1 ring-white/15">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-sf-sky">
              <ArrowUpRight size={15} aria-hidden /> {team.salesforce.label}
            </p>
            <p className="mt-2 text-[16px] text-night-dim">{team.salesforce.text}</p>
            <a className="btn-ghost mt-5" href={team.salesforce.url} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_salesforce_contact')}>
              {team.salesforce.label} <ArrowUpRight size={17} aria-hidden />
            </a>
          </div>
        </motion.div>

        <p className="mx-auto mt-12 max-w-[760px] text-center text-[13px] text-white/50">{site.legal.trademark} {site.legal.copyright}</p>
      </main>
    </div>
  );
}
