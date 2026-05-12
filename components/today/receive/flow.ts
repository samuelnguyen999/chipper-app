import { useCallback, useEffect, useRef, useState } from "react";
import { receiveTiming } from "./config";

/**
 * Phases for receive landing. Order is fixed; transitions live in `useLandingFlow`.
 */
export type LandingPhase =
  | "message_only"
  | "heading_sliding"
  | "quote_visible"
  | "pondering"
  | "continue_ready";

type UseLandingFlowResult = {
  phase: LandingPhase;
  ponderProgress: number;
  completeHeadingSlide: () => void;
};

/**
 * Timers and phase order. Heading motion is driven in `landing.tsx`;
 * call `completeHeadingSlide` when the slide animation finishes.
 */
export function useLandingFlow(): UseLandingFlowResult {
  const [phase, setPhase] = useState<LandingPhase>("message_only");
  const [ponderProgress, setPonderProgress] = useState(0);
  const ponderFrameRef = useRef<number | null>(null);

  const completeHeadingSlide = useCallback(() => {
    setPhase((current) => (current === "heading_sliding" ? "quote_visible" : current));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("heading_sliding");
    }, receiveTiming.heroHoldMs);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "quote_visible") {
      return;
    }
    const t = setTimeout(() => {
      setPhase("pondering");
    }, receiveTiming.quoteToPonderDelayMs);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "pondering") {
      return;
    }

    const start = Date.now();
    const duration = receiveTiming.ponderDurationMs;

    const tick = () => {
      const elapsed = Date.now() - start;
      const next = Math.min(100, (elapsed / duration) * 100);
      setPonderProgress(next);

      if (next >= 100) {
        ponderFrameRef.current = null;
        setPhase("continue_ready");
        return;
      }
      ponderFrameRef.current = requestAnimationFrame(tick);
    };

    ponderFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (ponderFrameRef.current != null) {
        cancelAnimationFrame(ponderFrameRef.current);
        ponderFrameRef.current = null;
      }
    };
  }, [phase]);

  return { phase, ponderProgress, completeHeadingSlide };
}
