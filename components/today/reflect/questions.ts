import type { DailyTheme } from "../dailyContent";

export type TodayQuestion = {
  type: "ground" | "understand" | "align";
  question: string;
};

export const reflectionQuestionsByTheme = {
  action: [
    { type: "ground", question: "What effort would I be proud of today?" },
    { type: "understand", question: "What are my actions revealing about what matters to me?" },
    { type: "align", question: "I commit to taking purposeful action toward..." },
  ],
  identity: [
    { type: "ground", question: "A strength that remains true about me." },
    { type: "understand", question: "What is being revealed about who I am becoming?" },
    { type: "align", question: "The person I want to be is someone who..." },
  ],
  discipline: [
    { type: "ground", question: "Which routine keeps me steady?" },
    { type: "understand", question: "Something I need to be more intentional about is..." },
    { type: "align", question: "What commitment can I strengthen?" },
  ],
  mindset: [
    { type: "ground", question: "What perspective brings me peace?" },
    { type: "understand", question: "An insight I'm noticing is..." },
    { type: "align", question: "This is the mindset I choose to carry." },
  ],
  resilience: [
    { type: "ground", question: "This is true and keeps me going..." },
    { type: "understand", question: "What am I learning through challenges?" },
    { type: "align", question: "Where will I choose courage over hesitation?" },
  ],
  connection: [
    { type: "ground", question: "Who brings meaning to my life?" },
    { type: "understand", question: "What am I learning about my relationships?" },
    { type: "align", question: "A way I can create more connection is..." },
  ],
  faith: [
    { type: "ground", question: "My hope and gratitude are found in..." },
    { type: "understand", question: "What is being revealed about my trust and purpose?" },
    { type: "align", question: "I take this next step with faith." },
  ],
} as const satisfies Record<DailyTheme, readonly TodayQuestion[]>;

export function getQuestionsForTheme(theme: DailyTheme): readonly TodayQuestion[] {
  return reflectionQuestionsByTheme[theme];
}
