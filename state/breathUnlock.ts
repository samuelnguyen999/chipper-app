/**
 * Tiny bridge so BreathUnlockOverlay can mount at root and survive
 * under-cover navigation to Community. Not a React context.
 */

type Listener = () => void;

let visible = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function getBreathUnlockVisible(): boolean {
  return visible;
}

export function startBreathUnlock(): void {
  if (visible) return;
  visible = true;
  emit();
}

export function endBreathUnlock(): void {
  if (!visible) return;
  visible = false;
  emit();
}

export function subscribeBreathUnlock(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
