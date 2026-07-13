import { getDailyContent } from "../dailyContent";
import type { TodayQuestion } from "./questions";

const purposeByType = {
  ground: "Anchor in what held you steady today.",
  understand: "Name what became clear through today.",
  align: "Choose one step that matches who you're becoming.",
} as const;

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