/**
 * Daily receive quote: one category per weekday (local), then rotation within that pool.
 * Lane pools: sibling `*.ts` files in this folder.
 */

import { actionQuotes } from "./action";
import { connectionQuotes } from "./connection";
import { disciplineQuotes } from "./discipline";
import { faithQuotes } from "./faith";
import { identityQuotes } from "./identity";
import { mindsetQuotes } from "./mindset";
import { resilienceQuotes } from "./resilience";

/** `getDay()` 0 = Sunday … 6 = Saturday */
export const WEEKDAY_TO_CATEGORY = [
  "action",
  "identity",
  "discipline",
  "mindset",
  "resilience",
  "connection",
  "faith",
] as const;

export type QuoteCategory = (typeof WEEKDAY_TO_CATEGORY)[number];

export const QUOTE_CATEGORY_ORDER: readonly QuoteCategory[] = [
  "faith",
  "action",
  "discipline",
  "mindset",
  "identity",
  "resilience",
  "connection",
];

export const DAILY_QUOTES: Record<QuoteCategory, readonly string[]> = {
  faith: faithQuotes,
  action: actionQuotes,
  discipline: disciplineQuotes,
  mindset: mindsetQuotes,
  identity: identityQuotes,
  resilience: resilienceQuotes,
  connection: connectionQuotes,
};

const FALLBACK_QUOTE = "Stay grounded. Move with purpose.";

function localDayOfYearIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function getQuotesForCategory(category: QuoteCategory): readonly string[] {
  return DAILY_QUOTES[category];
}

export function getCategoryForWeekday(date = new Date()): QuoteCategory {
  return WEEKDAY_TO_CATEGORY[date.getDay()];
}

export function getDailyReceiveQuote(date = new Date()): string {
  const category = getCategoryForWeekday(date);
  const list = DAILY_QUOTES[category];
  if (list.length === 0) {
    return FALLBACK_QUOTE;
  }
  return list[localDayOfYearIndex(date) % list.length];
}
