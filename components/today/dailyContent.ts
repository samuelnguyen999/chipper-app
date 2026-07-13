import { getQuestionsForTheme, type TodayQuestion } from "./reflect/questions";
import { getQuoteForTheme } from "./receive/quotes/dailyQuotes";

export type DailyTheme =
  | "action"
  | "identity"
  | "discipline"
  | "mindset"
  | "resilience"
  | "connection"
  | "faith";

/** `getDay()` 0 = Sunday … 6 = Saturday */
export const WEEKDAY_TO_THEME: readonly DailyTheme[] = [
  "action",
  "identity",
  "discipline",
  "mindset",
  "resilience",
  "connection",
  "faith",
];

export type DailyContent = {
  theme: DailyTheme;
  quote: string;
  questions: readonly TodayQuestion[];
};

/**
 * Central resolver for one local calendar day's Receive + Reflect content.
 * Consumed by receive/config.ts (quote) and reflect/config.ts (questions).
 */
export function getDailyTheme(date = new Date()): DailyTheme {
  return WEEKDAY_TO_THEME[date.getDay()];
}

export function getDailyReceiveQuote(date = new Date()): string {
  return getQuoteForTheme(getDailyTheme(date), date);
}

export function getDailyContent(date = new Date()): DailyContent {
  const theme = getDailyTheme(date);
  return {
    theme,
    quote: getDailyReceiveQuote(date),
    questions: resolveDailyQuestions(theme),
  };
}

function resolveDailyQuestions(theme: DailyTheme): readonly TodayQuestion[] {
  return getQuestionsForTheme(theme);
}
