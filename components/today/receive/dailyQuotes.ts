/**
 * Daily receive quote: **one category per weekday** (local time), then a quote
 * from that category’s pool using day-of-year rotation.
 *
 * | Day        | Category   |
 * |------------|------------|
 * | Sunday     | action     |
 * | Monday     | identity   |
 * | Tuesday    | discipline |
 * | Wednesday  | mindset    |
 * | Thursday   | resilience |
 * | Friday     | connection |
 * | Saturday   | faith      |
 */

import { actionQuotes } from "./quotes/action";
import { connectionQuotes } from "./quotes/connection";
import { disciplineQuotes } from "./quotes/discipline";
import { faithQuotes } from "./quotes/faith";
import { identityQuotes } from "./quotes/identity";
import { mindsetQuotes } from "./quotes/mindset";
import { resilienceQuotes } from "./quotes/resilience";

/** `getDay()` index 0 = Sunday … 6 = Saturday */
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

/** Stable union order for tooling / iteration (not weekday order). */
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

/** 0 on Jan 1 local time — used to rotate within the day’s category pool. */
function localDayOfYearIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function getQuotesForCategory(category: QuoteCategory): readonly string[] {
  return DAILY_QUOTES[category];
}

/** Category for today’s weekday (local). */
export function getCategoryForWeekday(date = new Date()): QuoteCategory {
  return WEEKDAY_TO_CATEGORY[date.getDay()];
}

/**
 * Quote for `date`: weekday picks **category**; day-of-year picks **index** inside that list.
 */
export function getDailyReceiveQuote(date = new Date()): string {
  const category = getCategoryForWeekday(date);
  const list = DAILY_QUOTES[category];
  if (list.length === 0) {
    return FALLBACK_QUOTE;
  }
  return list[localDayOfYearIndex(date) % list.length];
}
