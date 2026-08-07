/**
 * Daily receive quote pools keyed by {@link DailyTheme}.
 * Theme selection lives in `../../dailyContent.ts`; this module only resolves quotes.
 * Lane pools: sibling `*.ts` files in this folder.
 */

import type { DailyTheme } from "../../dailyContent";
import { actionQuotes } from "./action";
import { connectionQuotes } from "./connection";
import { disciplineQuotes } from "./discipline";
import { faithQuotes } from "./faith";
import { identityQuotes } from "./identity";
import { mindsetQuotes } from "./mindset";
import { resilienceQuotes } from "./resilience";

export const DAILY_QUOTES: Record<DailyTheme, readonly string[]> = {
  action: actionQuotes,
  identity: identityQuotes,
  discipline: disciplineQuotes,
  mindset: mindsetQuotes,
  resilience: resilienceQuotes,
  connection: connectionQuotes,
  faith: faithQuotes,
};

const FALLBACK_QUOTE = "It's Sweet At The Top";

/**
 * Fixed local Sunday — weekIndex 0 is the week that begins on this date.
 * Never change after shipping. Quote banks are append-only; selection uses
 * continuous weekIndex (not day-of-year / week-of-year), so each themed
 * weekday advances +1 mod length and growing a pool does not remapping prior weeks.
 */
/** Most recent Sunday before/at “ship” — JS months are 0-indexed (7 = August). */
const QUOTE_WEEK_EPOCH = new Date(2026, 7, 2); // Sunday 2026-08-02 local

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole local calendar days from `from` to `to` (can be negative if `to` is before `from`). */
function daysBetweenLocal(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Continuous week counter from {@link QUOTE_WEEK_EPOCH}: 0, 1, 2, … with no January reset.
 * Shared by every theme that week; each bank then does weekIndex % its own length.
 */
function weekIndexFromEpoch(date: Date): number {
  return Math.floor(daysBetweenLocal(QUOTE_WEEK_EPOCH, date) / 7);
}

function positiveMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getQuoteForTheme(theme: DailyTheme, date = new Date()): string {
  const list = DAILY_QUOTES[theme];
  if (list.length === 0) {
    return FALLBACK_QUOTE;
  }
  const weekIndex = weekIndexFromEpoch(date);
  return list[positiveMod(weekIndex, list.length)];
}
