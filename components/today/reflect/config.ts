const REFLECTION_LENSES = [
  {
    mode: "Release",
    purpose:
      "Create space to unload thoughts, emotions, and emotional weight.",
  },
  {
    mode: "Understand",
    purpose: "Bring clarity to what’s being felt, needed, or experienced internally.",
  },
  {
    mode: "Move",
    purpose:
      "Reconnect with intention, direction, and meaningful next steps.",
  },
] as const;

export const reflectionPromptByMode = {
  Release: "Where am I right now?",
  Understand: "What’s going on?",
  Move: "What do I do with this?",
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
