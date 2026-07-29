import { colors } from "../../../constants";
import { getDailyContent } from "../dailyContent";
import type { TodayQuestion } from "./questions";

const purposeByType = {
  ground: "Anchor yourself in the present with what supports you.",
  understand: "Explore what is unfolding with clarity.",
  align: "Take your next step and live aligned with who you are.",
} as const;

/** Type label colors: ground → green, understand → purple, align → orange. */
export const lensColorByType: Record<TodayQuestion["type"], string> = {
  ground: colors.lensGround,
  understand: colors.lensUnderstand,
  align: colors.lensAlign,
};

export function lensColorForType(type: TodayQuestion["type"]): string {
  return lensColorByType[type];
}

/** Resolve DB / row `card_type` to a known lens; falls back to ground. */
export function lensTypeFromCardType(cardType: string): TodayQuestion["type"] {
  const key = cardType.trim().toLowerCase();
  if (key === "ground" || key === "understand" || key === "align") return key;
  return "ground";
}

const dailyQuestions = getDailyContent().questions;

export const reflectionChoices = dailyQuestions.map((item) => ({
  type: item.type,
  mode: item.type.toUpperCase(),
  purpose: purposeByType[item.type],
  prompt: item.question,
})) as readonly {
  type: TodayQuestion["type"];
  mode: string;
  purpose: string;
  prompt: string;
}[];

export type ReflectionChoice = (typeof reflectionChoices)[number];