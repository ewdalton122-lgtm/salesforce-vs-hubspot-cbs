type Step = { hubspot: { system: string; status: string } };

/** Distinct systems the HubSpot path touches. */
export function computeSystems(steps: Step[]): string[] {
  return [...new Set(steps.map((s) => s.hubspot.system))];
}

/** Handoffs: adjacent steps whose HubSpot system differs. */
export function computeHandoffs(steps: Step[]): number {
  let n = 0;
  for (let i = 1; i < steps.length; i++) if (steps[i].hubspot.system !== steps[i - 1].hubspot.system) n++;
  return n;
}

/** Running tallies up to and including step index `upTo` (0-based). */
export function tallyUpTo(steps: Step[], upTo: number) {
  const slice = steps.slice(0, upTo + 1);
  return { systems: computeSystems(slice).length, handoffs: computeHandoffs(slice) };
}
