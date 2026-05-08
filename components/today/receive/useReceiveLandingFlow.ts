import { useCallback, useEffect, useRef, useState } from "react";
import { receiveTiming } from "./config";
import type { ReceiveLandingPhase } from "./types";

type UseReceiveLandingFlowResult = {
  phase: ReceiveLandingPhase;
  /** 0–100 while pondering; 100 when continue_ready */
  ponderProgress: number;
  /** Call when the heading slide animation has finished (Reanimated completion). */
  completeHeadingSlide: () => void;
};

/**
 * Centralizes timers and phase order. Heading motion is driven in the UI; this hook
 * exposes `completeHeadingSlide` to advance after the slide.
 */
export function useReceiveLandingFlow(): UseReceiveLandingFlowResult {
  const [phase, setPhase] = useState<ReceiveLandingPhase>("message_only");
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
