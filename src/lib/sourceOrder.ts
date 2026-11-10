import { checks, cost, story, journey, growth, platform, proof, questions, demoPaths, simulator, sources } from './content';
import { numberSources } from './footnotes';
import { readFlags } from './env';

/** Walks the content in the same order the page renders it, so footnote numbers read 1, 2, 3... down the page. */
export function pageSourceOrder({ includeCsm = true }: { includeCsm?: boolean } = {}): string[] {
  const ids: string[] = [];
  const push = (id: string) => ids.push(id);
  for (const c of checks.checks) {
    c.salesforce.points.forEach((p) => push(p.source));
    c.hubspot.points.forEach((p) => push(p.source));
    const act = story.acts.find((a) => a.checkId === c.id);
    act?.frictions.forEach((f) => push(f.source));
    story.officeFrictions[c.id]?.forEach((f) => push(f.source));
    if (c.id === 'cost') {
      growth.stages.forEach((s) => {
        s.salesforce && push(s.salesforce.source);
        s.hubspot.forEach((b) => push(b.source));
      });
      Object.values(growth.officeStages).forEach((s) => {
        push(s.salesforce.source);
        s.hubspot.forEach((b) => push(b.source));
      });
      ['hs-catalog-products', cost.tierJump.source].forEach(push);
      cost.salesforce.includes.forEach((i) => push(i.source));
      [cost.salesforce.source, cost.hubspot.seatSource, cost.hubspot.onboardingSource].forEach(push);
      cost.needs.forEach((n) => {
        push(n.sfSource);
        push(n.source);
      });
      cost.excluded.forEach((e) => push(e.source));
    }
    if (c.id === 'operations') {
      journey.steps.forEach((s) => {
        push(s.salesforce.source);
        push(s.hubspot.source);
      });
      Object.values(journey.byIndustry).forEach((o) =>
        Object.values(o).forEach((v) => {
          v.salesforce?.source && push(v.salesforce.source);
          v.hubspot?.source && push(v.hubspot.source);
        }),
      );
    }
  }
  platform.layers.forEach((l) => {
    push(l.source);
    l.brands.forEach((b) => push(b.source));
  });
  platform.openRail.forEach((r) => push(r.source));
  simulator.rules.forEach((r) => {
    push(r.salesforce.source);
    push(r.hubspot.source);
  });
  push(simulator.assumptions.source);
  if (includeCsm) push(proof.customerSuccessMetrics.source);
  proof.stories.forEach((s) => push(s.source));
  questions.videoAsks.forEach((q) => demoPaths[String(q.n)]?.forEach((d) => push(d.source)));
  return ids.filter((id) => id in sources);
}

// The social variant hides the Customer Success Metrics, so their source isn't numbered either.
export const footnoteNumbers = numberSources(pageSourceOrder({ includeCsm: readFlags().showCsm }));

export function footnoteNumber(id: string): number | undefined {
  return footnoteNumbers.get(id);
}
