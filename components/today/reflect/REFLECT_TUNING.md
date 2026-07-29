# Reflect lens stack — tuning & structure

**Primary implementation:** `parts/ReflectCardStack.tsx`  
**Orchestrator (list ↔ focus, unlock):** `Reflect.tsx` — see **`REFLECT_STATE.md`** for that flow.

This doc is for **humans adjusting motion** and **agents** changing stack behavior without re-reading the whole file.

---

## Mental model (3 concepts)

| Concept | Meaning |
|--------|---------|
| **Rest depth (cyclic)** | `stackDepthCyclic`: front = active index; cards “behind” wrap in ring order so **all three lenses** show peek edges at rest. |
| **Drag z-order (linear)** | `stackPeekDepth` / `stackPeekDepthUI`: while `dragX` is moving, z-order uses **strip order** so **3→2** and **2→1** peek the correct neighbor under the finger. |
| **Handoff** | On lens change: `outgoingIndexSV` = old front, `activeIdxSV` + React state = new front; `outgoingHandoffX` eases old card to center; delayed **depth tuck** only on the outgoing card. |

Shared values must stay **in sync on commit** (`outgoingIndexSV` then `activeIdxSV`) so paint order does not flicker — see `stackZIndexUI`.

---

## Where to change what

| Goal | Location |
|------|-----------|
| Timings, thresholds, peek offsets | **`ReflectCardStack.tsx`** → **Tuning** block (top of file) |
| Lens copy / count | **`questions.ts`** (prompts) + **`config.ts`** (`purposeByType`, colors, `reflectionChoices`) |
| Card chrome, purpose toggle | **`parts/ChoiceCard.tsx`** |
| List vs focus, unlock | **`Reflect.tsx`** |

---

## Tuning table (`ReflectCardStack.tsx` constants)

Values below match the **names in code**. Adjust in one place at the top of `ReflectCardStack.tsx`.

### Card frame (playing-card ratio)

| Constant | Role | Notes |
|----------|------|--------|
| `PLAYING_CARD_WIDTH_UNITS` / `HEIGHT` | Aspect 2.5×3.5 | Rarely change. |
| `CARD_MAX_WIDTH` | Cap width (px) | |
| `CARD_WIDTH_SCREEN_FRAC` | Max width vs screen | |
| `CARD_MAX_HEIGHT_SCREEN_FRAC` | Max height vs screen | |

### Stack peek at rest (depth 0 / 1 / 2 — cyclic targets)

| Constant | Role | Typical tweak |
|----------|------|----------------|
| `PEEK_TRANSLATE_Y` | Extra Y per depth | Larger → more vertical separation. |
| `PEEK_SCALE` | Scale per depth | Keep close to `1` for subtlety. |
| `PEEK_OPACITY` | Opacity per depth | Lower back cards slightly for depth read. |

### Global depth animation (non-outgoing cards on index change)

| Constant | Role | Notes |
|----------|------|--------|
| `STACK_TRANSITION_MS` | Duration for Y/scale/opacity to new rest targets | Longer = slower stack settle. |
| `STACK_EASING` | Reanimated easing | Usually `Easing.out(Easing.cubic)`. |

### Outgoing handoff (old front only)

| Constant | Role | Notes |
|----------|------|--------|
| `OUTGOING_RETURN_MS` | Horizontal ease `outgoingHandoffX` → 0 | |
| `OUTGOING_TUCK_DELAY_MS` | Wait before outgoing depth tuck starts | Lets new front read first. |
| `OUTGOING_TUCK_MS` | Outgoing card depth tuck duration | Often paired with delay above. |
| `HANDOFF_CLEAR_MS` | JS timeout to clear `outgoingIndexSV` / cancel handoff SVs | Must cover return + tuck + margin; increase if you lengthen animations. |
| `ARROW_RELEASE_PX` | Fake horizontal offset when using **chevrons** (no drag distance) | |

### Pan gesture

| Constant | Role | Notes |
|----------|------|--------|
| `PAN_ACTIVE_OFFSET_X` | Horizontal activation slop | Higher = fewer accidental drags. |
| `PAN_FAIL_OFFSET_Y` | Vertical fail tolerance | Lets scroll/tap win vs pan. |
| `SWIPE_COMMIT_THRESHOLD_PX` | Release distance to change lens | |
| `SWIPE_DRAG_CLAMP_PX` | Max drag offset while finger down | |
| `DRAG_RESET_MS` | Cancelled swipe: `dragX` back to 0 | |

---

## Code map (`ReflectCardStack.tsx` sections)

Read the file top-down:

1. **Tuning** — all constants; change here first.  
2. **Card frame** — `useReflectCardFrame`.  
3. **Depth helpers** — `stackDepthCyclic*`, `stackPeekDepth*`, `stackZIndexUI`.  
4. **Layer motion** — `LayerMotion`, `useThreeLayerMotions`, `applyDepthTargets`.  
5. **`ReflectCardStack`** — state, shared values, `useEffect` depth sync + handoff clear, pan + arrows.  
6. **`StackedChoiceCard`** — per-card `useAnimatedStyle` (X from drag or outgoing handoff; Y/scale/opacity from `layers[i]`).  
7. **Styles** — layout only.

---

## Stability note (`layers`)

`useThreeLayerMotions` returns a **`useMemo`’d tuple** of layer objects so the `useEffect` that calls `applyDepthTargets` does **not** re-run on unrelated parent re-renders (e.g. purpose toggle). Do not replace with a fresh array every render.

---

## Related docs

- **`REFLECT_STATE.md`** — Reflect screen architecture, unlock, `FocusView`, `config.ts`.  
- **`parts/ChoiceCard.tsx`** — purpose slot, prompt layering.  

*Update this file when you add new tuning constants or change the handoff model.*
