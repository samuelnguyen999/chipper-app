import type { DailyTheme } from "../dailyContent";

export type TodayQuestion = {
  type: "ground" | "understand" | "align";
  question: string;
};

export const reflectionQuestionsByTheme = {
  action: [
    { type: "ground", question: "What reminds me I am moving forward?" },
    { type: "understand", question: "What are my actions revealing about what matters to me?" },
    { type: "align", question: "What action can I take with purpose?" },
  ],
  identity: [
    { type: "ground", question: "What part of myself am I becoming more aware of?" },
    { type: "understand", question: "What is being revealed about who I am becoming?" },
    { type: "align", question: "What choice reflects the person I want to become?" },
  ],
  discipline: [
    { type: "ground", question: "What helps me stay steady?" },
    { type: "understand", question: "What am I learning about my consistency?" },
    { type: "align", question: "What commitment can I strengthen?" },
  ],
  mindset: [
    { type: "ground", question: "What perspective helps me stay grounded?" },
    { type: "understand", question: "What thought or belief am I becoming aware of?" },
    { type: "align", question: "What mindset do I want to carry forward?" },
  ],
  resilience: [
    { type: "ground", question: "What helps me remain strong?" },
    { type: "understand", question: "What am I learning through challenges?" },
    { type: "align", question: "How can I respond with courage?" },
  ],
  connection: [
    { type: "ground", question: "Who or what brings meaning to my life?" },
    { type: "understand", question: "What am I learning about my relationships?" },
    { type: "align", question: "How can I create deeper connection?" },
  ],
  faith: [
    { type: "ground", question: "What reminds me of hope and gratitude?" },
    { type: "understand", question: "What is being revealed about my trust and purpose?" },
    { type: "align", question: "How can I live with greater faith?" },
  ],
} as const satisfies Record<DailyTheme, readonly TodayQuestion[]>;

export function getQuestionsForTheme(theme: DailyTheme): readonly TodayQuestion[] {
  return reflectionQuestionsByTheme[theme];
}
