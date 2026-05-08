import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ReflectionResponse = {
  id: string;
  mode: string;
  prompt: string;
  response: string;
  createdAt: string;
};

type ReflectionResponsesContextValue = {
  responses: ReflectionResponse[];
  /** Returns true if a non-empty response was stored. */
  addResponse: (input: Omit<ReflectionResponse, "id" | "createdAt">) => boolean;
};

const ReflectionResponsesContext = createContext<ReflectionResponsesContextValue | null>(
  null,
);

export function ReflectionResponsesProvider({ children }: { children: ReactNode }) {
  const [responses, setResponses] = useState<ReflectionResponse[]>([]);

  const addResponse: ReflectionResponsesContextValue["addResponse"] = useCallback(
    (input) => {
      const trimmed = input.response.trim();
      if (!trimmed) {
        return false;
      }

      setResponses((current) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mode: input.mode,
          prompt: input.prompt,
          response: trimmed,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return true;
    },
    [],
  );

  const value = useMemo(
    () => ({
      responses,
      addResponse,
    }),
    [responses, addResponse],
  );

  return (
    <ReflectionResponsesContext.Provider value={value}>
      {children}
    </ReflectionResponsesContext.Provider>
  );
}

export function useReflectionResponses() {
  const context = useContext(ReflectionResponsesContext);
  if (!context) {
    throw new Error(
      "useReflectionResponses must be used inside ReflectionResponsesProvider",
    );
  }
  return context;
}
