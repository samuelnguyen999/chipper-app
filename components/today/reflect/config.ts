const REFLECTION_LENSES = [
  {
    mode: "Ground",
    purpose:
      "Bring awareness to the present moment before deeper thinking happens.",
  },
  {
    mode: "Understand",
    purpose: "Help users understand what’s happening internally and relationally.",
  },
  {
    mode: "Align",
    purpose:
      "Close the loop so reflection doesn’t stay internal—it becomes lived change.",
  },
] as const;

export const reflectionPromptByMode = {
  Ground: "Where am I right now?",
  Understand: "What’s going on?",
  Align: "What do I do with this?",
} as const;

export const reflectionChoices = REFLECTION_LENSES.map((lens) => ({
  ...lens,
  prompt: reflectionPromptByMode[lens.mode],
})) as readonly {
  mode: (typeof REFLECTION_LENSES)[number]["mode"];
  purpose: (typeof REFLECTION_LENSES)[number]["purpose"];
  prompt: string;
}[];

export type ReflectionChoice = (typeof reflectionChoices)[number];
