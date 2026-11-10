type Stage = { hubspot: unknown[]; salesforce: { addOn: boolean } };

/** Counts after completing `stage` stages (1-based). */
export function growthCounts(stages: Stage[], stage: number) {
  const done = stages.slice(0, Math.max(0, Math.min(stage, stages.length)));
  return {
    hubspotBlocks: done.reduce((n, s) => n + s.hubspot.length, 0),
    salesforceTiles: done.length,
    salesforceAddOns: done.filter((s) => s.salesforce.addOn).length,
  };
}
