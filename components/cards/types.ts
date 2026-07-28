export type ReflectionCardData = {
  id: string;
  /** Lens type — drives border color (ground / understand / align). */
  type: "ground" | "understand" | "align";
  mode: string;
  prompt: string;
  response: string;
};
