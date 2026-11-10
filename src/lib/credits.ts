export type CreditAssumptions = { creditsPerConversation: number; includedCredits: number; daysPerMonth: number };

export function creditMath(aiConversations: number, a: CreditAssumptions) {
  const creditsNeeded = aiConversations * a.creditsPerConversation;
  const dailyBurn = creditsNeeded / a.daysPerMonth;
  const daysCovered =
    creditsNeeded <= a.includedCredits ? a.daysPerMonth : Math.max(1, Math.floor(a.includedCredits / dailyBurn));
  return { creditsNeeded, dailyBurn, daysCovered, exceeds: creditsNeeded > a.includedCredits };
}

/** 30-day grid: true = agents running on included credits, false = paused unless packs are bought. */
export function creditCalendar(daysCovered: number, daysPerMonth = 30): boolean[] {
  return Array.from({ length: daysPerMonth }, (_, i) => i < daysCovered);
}
