# Reflect flow — architecture reference

**Scope:** This folder implements the **Reflect** half of **locked Today** (`TodayExperience` → Receive `Landing` → **Reflect**). It runs **after** the user finishes Receive (ponder CTA). Post-unlock **Today** tab does not re-host this screen; it is specific to the **pre-unlock** path unless you intentionally reuse `Reflect` elsewhere.

**Audience:** Future agents and humans doing review or adaptation—read **`../receive/RECEIVE_STATE.md`** first for locked Today context, then this file before changing lenses, copy, submit/unlock wiring, or shared card chrome.

**Stack motion (focus lens switcher):** **`REFLECT_TUNING.md`** — constants, depth model, and a section map for **`parts/ReflectCardStack.tsx`**.

---

## Folder layout (importance order)

| Layer | Path | Responsibility |
|---|---|---|
| Daily questions | `questions.ts` | `TodayQuestion`, `reflectionQuestionsByTheme`, `getQuestionsForTheme` — prompts by weekday **theme** (ground / understand / align). |
| Lens assembly | `config.ts` | `purposeByType`, `lensColorByType` / `lensColorForType` / `lensTypeFromCardType`, builds **`reflectionChoices`** from `getDailyContent().questions`. |
| Daily resolver | `../dailyContent.ts` | Theme + quote + questions for the local calendar day (shared with Receive). |
| UI orchestration | `Reflect.tsx` | List vs focus, safe-area padding when tabs locked, submit → save / offline / **duplicate** handling → `unlockMainTabs` → `onUnlocked`. |
| Atoms | `parts/*` | Presentational only — no tab unlock or global response writes. |
| Public API | `index.ts` | Default **`Reflect`**, `reflectionChoices`, question helpers/types. |

**Design rule:** `Reflect.tsx` owns **navigation between list and focus** and **unlock side effects**; `parts/FocusView` owns **keyboard submit UX** and calls `onSubmitResponse` only; it must not call `unlockMainTabs` directly.

---

## Lenses (ground / understand / align)

| Piece | Where |
|---|---|
| Lens **types** + daily **prompts** | `questions.ts` → pools per `DailyTheme` |
| Stable **purpose** copy per type | `config.ts` → `purposeByType` |
| Label / border **colors** | `config.ts` + `constants/colors.ts` (`lensGround` / `lensUnderstand` / `lensAlign`) |
| Runtime list for UI | `config.ts` → `reflectionChoices` (`type`, `mode` = `TYPE.upper`, `purpose`, `prompt`) |
| DB / row → lens | `lensTypeFromCardType(card_type)` (fallback `ground`) |

There is **no** `reflectionPromptByMode`, **`REFLECTION_LENSES`**, or FocusView **`variantForMode`**. Stack → focus uses one shared grow / chrome-collapse animation for all lenses; color is the main per-lens distinction.

---

## View lifecycle (list ↔ focus)

| State | What the user sees |
|---|---|
| **List** | Header + **`ReflectCardStack`** of **`ChoiceCard`**s from `reflectionChoices`. |
| **Focus** | **`FocusView`** for the selected `ReflectionChoice`: back (“All lenses”), prompt handoff grow, response field, visibility toggle, submit. |

| Transition | Trigger |
|---|---|
| List → Focus | Tap prompt area on a **`ChoiceCard`**. |
| Focus → List | Back row (reverse grow) **or** successful submit / duplicate unlock path (clears focus). |

---

## Submission and unlock behavior

On submit from **`FocusView`**, **`Reflect.tsx`** `handleSubmitResponse`:

1. **Online:** `saveReflection({ cardType, question, response, isPublic })` via **`lib/reflections.ts`**.
2. **On success:** `unlockMainTabs()` + optional **`onUnlocked()`** (`router.replace("/(tabs)")`).
3. **Offline / network failure:** `addOfflineReflection()` → Alert (“Saved on this device…”) → same unlock. See **`lib/OFFLINE_STATE.md`**.
4. **Duplicate same-day** (Postgres unique / already-queued offline): Alert (“Already reflected today”) → **still unlock**; **no** new Supabase row and **no** second offline queue item. (`DuplicateReflectionError` / `isDuplicateReflectionError` in `lib/reflections.ts`.)
5. **Other non-network failures:** inline error; **no** unlock.

Device visibility preference (public/private default) lives in **`lib/reflectionPreferences.ts`** (AsyncStorage).

---

## Reflection persistence

| API | Behavior |
|---|---|
| `saveReflection(...)` | Inserts row for current user; `is_public` from visibility toggle. Throws `DuplicateReflectionError` on unique violation. |
| `getTodaysCommunity()` | Today's public rows for Community. |
| `getMyReflections()` | Current user history for Journal. |
| Offline queue | Pending only — **`lib/offlineReflections.ts`** / **`OFFLINE_STATE.md`**. Sync drops queue items that hit duplicate. |

---

## Rotation workflow (daily prompt updates)

1. Edit prompts in **`questions.ts`** under the relevant **theme** (`action`, `identity`, …) — keep **`type`**: `ground` | `understand` | `align`.
2. Edit purpose blurbs in **`config.ts`** → **`purposeByType`** if needed (stable per type, not per theme).
3. Weekday → theme mapping stays in **`../dailyContent.ts`** (`WEEKDAY_TO_THEME`) — same themes as Receive quotes.

Stored / Community rows key off **`card_type`** (lens type string), not the display `mode` label.

---

## Integration points (rest of app)

- **`components/today/TodayExperience.tsx`** — default-imports **`./reflect`** (`Reflect`); toggles from Receive landing to Reflect after CTA.
- **`app/(locked)/index.tsx`** — passes **`onUnlocked`** into Today / Reflect for route replace after first valid submit (see Receive doc integration table).
- **`lib/reflections.ts`** — Supabase persistence + duplicate detection.
- **`lib/offlineReflections.ts`** — offline queue + sync.
- **`components/cards/`** — shared **`CardShell`**, **`ReflectionCard`**, **`CardContainer`**. Community/Journal use adapters; Reflect lens UI uses **`CardShell`** from **`components/cards/CardShell.tsx`** (not under `parts/`).

---

## Parts map

| File | Role |
|---|---|
| `parts/ChoiceCard.tsx` | Lens face: purpose toggle, animated purpose slot, tappable prompt; lens-colored border/label (`CardShell`). |
| `parts/FocusView.tsx` | Shared grow handoff from stack size → full slot, chrome collapse, response fade, visibility toggle, submit. Exports timing constants used by Reflect back-link fade. |
| `parts/ReflectCardStack.tsx` | 1–3 lens swipe stack. Tune via **`REFLECT_TUNING.md`**. |

---

## Pros / cons (current state)

| Pros | Cons / risks |
|---|---|
| **Thin orchestrator** — `Reflect.tsx` owns save / offline / duplicate / unlock. | Non-network save errors still block unlock (intentional). |
| **Shared daily content** with Receive via `dailyContent.ts`. | Module-eval of `getDailyContent()` in `config.ts` — same midnight caveat as Receive quote. |
| **Offline unlock** — queue + sync without redesigning UI. | Queue is device-local until sync; Community stays online-only. |
| **`parts/`** presentational; cards shared via **`components/cards/`**. | Focus motion is one shared path — per-lens entrances would be new work, not `variantForMode`. |

---

## Future adaptations (recipes)

| Goal | Where to change |
|---|---|
| New / edit daily prompts | `questions.ts` by theme; keep three types. |
| New lens type | `TodayQuestion["type"]`, `purposeByType`, colors, DB constraint, adapters — **not** a single `REFLECTION_LENSES` list. |
| Purpose / colors only | `config.ts` (+ `constants/colors.ts`). |
| Persist / offline / duplicate | `lib/reflections.ts` + `lib/offlineReflections.ts`; unlock path in **`Reflect.tsx`**. |
| Different unlock rule | Adjust **`Reflect.tsx`** only; do not scatter `unlockMainTabs` into `parts/*`. |
| Community / Journal card chrome | **`components/cards/ReflectionCard.tsx`** (adapters stay thin). |

---

## Review checklist (PRs touching Reflect)

- [ ] View lifecycle table above still matches **`Reflect.tsx`** + **`parts/FocusView.tsx`**.
- [ ] Unlock runs after successful **`saveReflection`**, successful offline queue write, **or** handled duplicate.
- [ ] Non-network, non-duplicate errors do not unlock and do not write the offline queue.
- [ ] Duplicates do not insert a second Supabase row or a second same-day offline item.
- [ ] `parts/*` files do not import **`TabAccessContext`** or call **`saveReflection`** directly.
- [ ] Prompt edits landed in **`questions.ts`** (not a removed `reflectionPromptByMode`).
- [ ] If lens list / types changed: `npx tsc --noEmit` and smoke Receive → Reflect → tabs.

---

## Quick edit map

| Change | File |
|---|---|
| Daily prompts (by theme) | `questions.ts` |
| Lens purposes, colors, choice assembly | `config.ts` |
| Weekday → theme | `../dailyContent.ts` |
| List layout, header copy, submit/unlock | `Reflect.tsx` |
| Card chrome (border, padding) | `components/cards/CardShell.tsx` |
| Purpose toggle / prompt press target | `parts/ChoiceCard.tsx` |
| Grow handoff, input submit UX | `parts/FocusView.tsx` |
| Stack peek, swipe thresholds, handoff timing | `parts/ReflectCardStack.tsx` + **`REFLECT_TUNING.md`** |

---

*Keep this file in sync when Reflect architecture or unlock wiring changes.*
