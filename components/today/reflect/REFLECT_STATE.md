# Reflect flow — architecture reference

**Scope:** This folder implements the **Reflect** half of **locked Today** (`TodayExperience` → Receive `Landing` → **Reflect**). It runs **after** the user finishes Receive (ponder CTA). Post-unlock **Today** tab does not re-host this screen; it is specific to the **pre-unlock** path unless you intentionally reuse `Reflect` elsewhere.

**Audience:** Future agents and humans doing review or adaptation—read **`../receive/RECEIVE_STATE.md`** first for locked Today context, then this file before changing lenses, copy, submit/unlock wiring, or shared card chrome.

**Stack motion (focus lens switcher):** **`REFLECT_TUNING.md`** — constants, depth model, and a section map for **`parts/ReflectCardStack.tsx`**.

---

## Folder layout (importance order)

| Layer | Path | Responsibility |
|---|---|---|
| Copy + lens list | `config.ts` | `reflectionPromptByMode`, `reflectionChoices`, `ReflectionChoice` type. |
| UI orchestration | `Reflect.tsx` | List vs focus view, safe-area padding when tabs locked, submit → `saveReflection` → `unlockMainTabs` → `onUnlocked`. |
| Atoms | `parts/*` | Presentational only — no tab unlock or global response writes. |
| Public API | `index.ts` | Default **`Reflect`**, config exports. |

**Design rule:** `Reflect.tsx` owns **navigation between list and focus** and **unlock side effects**; `parts/FocusView` owns **keyboard submit UX** and calls `onSubmitResponse` only; it must not call `unlockMainTabs` directly.

---

## View lifecycle (list ↔ focus)

| State | What the user sees |
|---|---|
| **List** | Header + stacked **`ChoiceCard`** rows from `reflectionChoices`. |
| **Focus** | **`FocusView`** for the selected `ReflectionChoice`: back control, prompt, `TextInput`, submit on keyboard **Done** (trimmed non-empty only). |

| Transition | Trigger |
|---|---|
| List → Focus | Tap prompt area on a **`ChoiceCard`**. |
| Focus → List | Back row **or** successful submit ( **`FocusView`** clears draft and calls `onBack` after `onSubmitResponse`). |

---

## Submission and unlock behavior

On submit from **`FocusView`**, **`Reflect.tsx`** `onSubmitResponse`:

1. `saveReflection({ cardType, question, response, isPublic })` via **`lib/reflections.ts`** — persists to Supabase `reflections` table.
2. On success: `unlockMainTabs()` from **`TabAccessContext`**, then optional **`onUnlocked()`** (locked route uses this for `router.replace("/(tabs)")`).
3. On failure: error message shown; no unlock.

---

## Reflection persistence

| API | Behavior |
|---|---|
| `saveReflection(...)` | Inserts row for current user; `is_public` from visibility toggle. Supabase `reflections` table is the source of truth. |
| `getTodaysCommunity()` | Fetches today's public reflections for Community tab. |

---

## Rotation workflow (daily prompt updates)

Update **`reflectionPromptByMode`** in **`config.ts`** while keeping stable **`mode`** and **`purpose`** strings (Community and stored rows key off them).

---

## Integration points (rest of app)

- **`components/today/TodayExperience.tsx`** — default-imports **`./reflect`** (`Reflect`); toggles from Receive landing to Reflect after CTA.
- **`app/(locked)/index.tsx`** — passes **`onUnlocked`** into Today / Reflect for route replace after first valid submit (see Receive doc integration table).
- **`lib/reflections.ts`** — Supabase persistence (`saveReflection`, `getTodaysCommunity`).
- **`components/community/CommunityReflectionCard.tsx`** — default-imports **`CardShell`** from **`../today/reflect/parts/CardShell`** so Community does not pull **`Reflect.tsx`** through the barrel (keeps chunks and init order predictable).

---

## Parts map

| File | Role |
|---|---|
| `parts/CardShell.tsx` | Shared bordered surface (Reflect choices + Community cards). |
| `parts/ChoiceCard.tsx` | Lens row: purpose toggle, animated purpose reveal, tappable prompt. |
| `parts/FocusView.tsx` | Reanimated entrance per mode, back, input, Done → submit callback. |
| `parts/ReflectCardStack.tsx` | Focus mode: 1–3 lens swipe stack (cyclic rest depth, linear drag z-order, outgoing handoff). Tune via **`REFLECT_TUNING.md`**. |

---

## Pros / cons (current state)

| Pros | Cons / risks |
|---|---|
| **Thin orchestrator** — `Reflect.tsx` stays small and readable. | **Supabase dependency** — failed save blocks unlock until retry succeeds. |
| **`parts/`** mirrors Receive’s presentational split. | **Duplicated mode→animation map** in `FocusView` (`variantForMode`) must stay aligned if you add lenses in `config`. |
| **`CardShell`** reused in Community for visual consistency. | **Cross-import path:** Community imports **`parts/CardShell`** directly so the **`reflect`** barrel does not pull **`Reflect`** into unrelated routes. |

---

## Future adaptations (recipes)

| Goal | Where to change |
|---|---|
| New lens | Extend `REFLECTION_LENSES` + `reflectionPromptByMode` in `config.ts`; add `variantForMode` branch in `parts/FocusView.tsx` if you want a distinct entrance. |
| Persist responses | Already via **`lib/reflections.ts`** / Supabase; adjust schema or RLS in Supabase dashboard. |
| Different unlock rule | Adjust **`Reflect.tsx`** only; do not scatter `unlockMainTabs` into `parts/*`. |
| Community card chrome diverges | Fork shell or pass variants from **`CardShell`** props—coordinate with Reflect cards. |

---

## Review checklist (PRs touching Reflect)

- [ ] View lifecycle table above still matches **`Reflect.tsx`** + **`parts/FocusView.tsx`**.
- [ ] First successful submit still calls **`unlockMainTabs`** only after **`saveReflection`** succeeds.
- [ ] `parts/*` files do not import **`TabAccessContext`** or **`lib/reflections`** directly.
- [ ] If **`config.ts`** lens list changed: run `npx tsc --noEmit` and smoke **locked Today** through Receive → Reflect → tabs.

---

## Quick edit map

| Change | File |
|---|---|
| Lens names, purposes, prompts | `config.ts` |
| List layout, header copy | `Reflect.tsx` |
| Card chrome (border, padding) | `parts/CardShell.tsx` |
| Purpose toggle / prompt press target | `parts/ChoiceCard.tsx` |
| Entrance motion, input submit UX | `parts/FocusView.tsx` |
| Stack peek, swipe thresholds, handoff timing | `parts/ReflectCardStack.tsx` + **`REFLECT_TUNING.md`** |

---

*Keep this file in sync when Reflect architecture or unlock wiring changes.*
