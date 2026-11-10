import { GitMerge, Truck, PhoneCall, Receipt } from 'lucide-react';
import { site } from '../lib/content';
import { SectionHead } from '../components/ui';

const PRESSURE_ICONS = [GitMerge, Truck, PhoneCall, Receipt];

export default function Reality() {
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
      </div>
    </section>
  );
}
