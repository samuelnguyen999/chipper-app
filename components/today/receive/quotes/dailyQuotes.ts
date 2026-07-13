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

const FALLBACK_QUOTE = "Stay grounded. Move with purpose.";

function localDayOfYearIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function getQuoteForTheme(theme: DailyTheme, date = new Date()): string {
  const list = DAILY_QUOTES[theme];
  if (list.length === 0) {
    return FALLBACK_QUOTE;
  }
  return list[localDayOfYearIndex(date) % list.length];
}
