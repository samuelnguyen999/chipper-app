/**
 * Aggregates categorized quote modules for Receive (`receiveCopy.quote`).
 * Per-category files live in `./quotes/` — add strings there; order rotation via `QUOTE_CATEGORY_ORDER`.
 */

import { actionQuotes } from "./quotes/action";
import { disciplineQuotes } from "./quotes/discipline";
import { faithQuotes } from "./quotes/faith";
import { identityQuotes } from "./quotes/identity";
import { mindsetQuotes } from "./quotes/mindset";
import { resilienceQuotes } from "./quotes/resilience";

export const QUOTE_CATEGORY_ORDER = [
  "faith",
  "action",
  "discipline",
  "mindset",
  "identity",
  "resilience",
] as const;

export type QuoteCategory = (typeof QUOTE_CATEGORY_ORDER)[number];

export const DAILY_QUOTES: Record<QuoteCategory, readonly string[]> = {
  faith: faithQuotes,
  action: actionQuotes,
  discipline: disciplineQuotes,
  mindset: mindsetQuotes,
  identity: identityQuotes,
  resilience: resilienceQuotes,
};

const FALLBACK_QUOTE = "Stay grounded. Move with purpose.";

function totalQuoteCount(): number {
  return QUOTE_CATEGORY_ORDER.reduce(
    (n, cat) => n + DAILY_QUOTES[cat].length,
    0,
  );
}

/** 0 on Jan 1 local time, increments each local calendar day. */
function localDayOfYearIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function getQuotesForCategory(category: QuoteCategory): readonly string[] {
  return DAILY_QUOTES[category];
}

/**
 * Quote for the current local calendar day, rotating through categories in `QUOTE_CATEGORY_ORDER`.
 */
export function getDailyReceiveQuote(date = new Date()): string {
  const total = totalQuoteCount();
  if (total === 0) {
    return FALLBACK_QUOTE;
  }
  let idx = localDayOfYearIndex(date) % total;
  for (const cat of QUOTE_CATEGORY_ORDER) {
    const list = DAILY_QUOTES[cat];
    if (idx < list.length) {
      return list[idx];
    }
    idx -= list.length;
  }
  return FALLBACK_QUOTE;
}
