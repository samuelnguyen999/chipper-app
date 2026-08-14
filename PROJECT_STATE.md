# PROJECT_STATE.md

**Instructions for AI / new agents:** Read this file at the start of a session before large changes. It summarizes stack, layout, conventions, what’s done, known issues, and sensible next steps.

---

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | **Expo SDK ~54** (`expo ~54.0.0`) |
| Router | **Expo Router ~6** (`expo-router`), file-based routes under `app/` |
| UI | **React Native 0.81.5**, **React 19.1** |
| Navigation (tabs) | **@react-navigation/material-top-tabs** via `expo-router` `withLayoutContext` — **swipeable** tab transitions; tab bar at **bottom** |
| Animations | **react-native-reanimated ~4.1** (+ `react-native-worklets`). Babel: **`react-native-reanimated/plugin` must be last** in `babel.config.js` |
| Gestures | **react-native-gesture-handler**; root wrapped in `GestureHandlerRootView` in `app/_layout.tsx` |
| Icons | **@expo/vector-icons** (e.g. Ionicons) |
| TypeScript | **strict**, `tsconfig` extends `expo/tsconfig.base` |
| Deep linking | **`app.json` → `expo.scheme`: `chipperapp`** |
| Backend | **Supabase** (`@supabase/supabase-js`) — anonymous auth; see **`lib/SUPABASE_STATE.md`** |
| Local storage | **@react-native-async-storage/async-storage** — auth session, fonts, visibility, offline queue, acknowledgements, onboarding date |
| Connectivity | **@react-native-community/netinfo** |
| Client moderation | **leo-profanity** — used only via **`lib/moderationService.ts`** |

**Expo Go note:** Reanimated 4 + Worklets need an **Expo Go build that matches SDK 54**. Native `Worklets` / `installTurboModule` crashes → align Go ↔ SDK, `npx expo start -c`, or a **development build**.

---

## Architecture (hierarchical)

### 1) Root shell and providers

| Path | Responsibility |
|---|---|
| `app/_layout.tsx` | Root `Stack`; `useAnonymousAuth` + fonts gate splash; `OfflineReflectionSync`; wraps `TabAccessProvider`, `FontPresetProvider`; hosts `BreathUnlockHost`. |
| `app/index.tsx` | Startup gate; redirects to `/(locked)` or `/(tabs)` after tab-access hydration. |

### 2) Route groups by app phase

| Route group | Responsibility | Primary files |
|---|---|---|
| `/(locked)` | Pre-unlock Today-only experience. | `app/(locked)/_layout.tsx`, `app/(locked)/index.tsx` |
| `/(tabs)` | Post-unlock tab shell (`index`, `community`, `profile`). | `app/(tabs)/_layout.tsx`, tab screens |
| Other app routes | Full Journal + fallbacks. | `app/journal.tsx`, `app/+not-found.tsx`, `app/post/[id].tsx` (stub UI) |

### 3) Navigation behavior and safeguards

| Concern | Where | Notes |
|---|---|---|
| Tab route registration | `app/(tabs)/_layout.tsx` | `withLayoutContext(..., true)` ensures only explicit `Tabs.Screen` entries are mounted. |
| Unlock + breath | `Reflect.tsx` → `breathUnlock` module → root `BreathUnlockHost` | Submit unlock starts breath overlay; host navigates under cover to Community, then settles. |
| Locked-route fallback | `state/useRedirectWhenTabsLocked.ts` | Tab/journal screens redirect to `/(locked)` if focused while locked. |

### 4) Feature boundaries

| Feature | Folder | Notes |
|---|---|---|
| Today (experience + recap) | `components/today/` | Locked `TodayExperience`; post-unlock `TodayRecap`. |
| Receive | `components/today/receive/` | Public names: `ReceiveLanding*` + `useLandingFlow` / `LandingPhase`. See **`RECEIVE_STATE.md`**. |
| Reflect | `components/today/reflect/` | Lenses + `FocusView`; client moderation before save. See **`REFLECT_STATE.md`**. |
| Shared cards | `components/cards/` | `ReflectionCard` (inline edit + exit wipe), `CardShell`, `CardContainer`. |
| Card interactions | `components/interactions/` | `resolveCardActions` → `CardInteractionProvider` → `CardExpandedActions`. |
| Community | `components/community/` | Today’s public rows; acknowledge chip / presence / purpose UI. |
| Profile / Journal | `components/profile/` | Title **“Profile”**; gallery + Journal; fonts. See **`PROFILE_STATE.md`**. |

### 5) Shared modules and config surfaces

| Area | Location | Notes |
|---|---|---|
| UI tokens | `constants/` | Colors, spacing/layout, typography Proxy (`textStyles`), scene shells. |
| Fonts | `constants/fonts.ts`, `FontPresetContext` | Module active preset + React context; screens call `useFontPresetSubscription()`. |
| Supabase + auth | `lib/supabase.ts`, `hooks/useAnonymousAuth.ts` | See **`lib/SUPABASE_STATE.md`**. |
| Reflections (online) | `lib/reflections.ts` | save / update / delete / visibility / community / journal queries. |
| Offline queue | `lib/offlineReflections.ts`, `hooks/useOfflineReflectionSync.ts` | See **`lib/OFFLINE_STATE.md`**. |
| Card list mutations | `hooks/useReflectionCardMutations.ts` | Shared edit / save / exit-wipe session for Journal + Community. |
| Acknowledgements | `lib/acknowledgementService.ts`, `lib/featureFlags.ts` | Reader-only; gated by `extra.acknowledgementsEnabled`. |
| Moderation (client v1) | `lib/moderationService.ts` | `moderateReflection` before Reflect submit; no server layer yet. |
| Visibility preference | `lib/reflectionPreferences.ts` | Device-local public/private default for Reflect. |
| Breath unlock bridge | `state/breathUnlock.ts` | Module store so overlay survives route replace. |
| Runtime config | `app.json`, `babel.config.js` | Linking/scheme, **`devStartAt`**. |

### 6) Detailed flow docs

- Receive: `components/today/receive/RECEIVE_STATE.md`
- Reflect: `components/today/reflect/REFLECT_STATE.md`
- Profile / Journal: `components/profile/PROFILE_STATE.md`
- Supabase / auth: `lib/SUPABASE_STATE.md`
- Offline reflections V1: `lib/OFFLINE_STATE.md`

**Gotcha:** Never pass a raw `{ screenOptions: ... }` object as a child of `<Stack>`; use `Stack.Screen` children and navigator props.

---

## Cross-cutting systems (current)

### Card interactions pipeline

```
Screen (Journal | Community)
  → CardInteractionProvider(handlers)
  → hold → openCardActions → resolveCardActions (ownership / today / feature rules)
  → CardExpandedActions (presentation only)
  → ReflectionCard (inline TextInput edit surface; exit wipe animation)
```

- **Rules:** `resolveCardActions` only.
- **List mutations (edit / save / delete / private-exit):** `useReflectionCardMutations` — returns `beginEdit`, `saveEdit`, `startExit`, `finishExit`, `setEditDraft`, ids. Screens compose visibility / acknowledge policy themselves.
- **Journal visibility:** in-place `updateReflectionVisibility` (private rows stay).
- **Community make-private:** `startExit({ kind: "private" })` then API in `finishExit` after wipe (same motion as delete).
- **Do not** move edit UI into `CardExpandedActions`.

### Acknowledgements

- Intentional **reader-only** practice — not a social metric; writer is never notified.
- Client daily limit via AsyncStorage (`acknowledgementService`); local chip on Community cards.
- Optional presence moment / purpose copy when enabled via feature flag.
- No public count on reflections.

### Moderation (Reflect submit)

- `FocusView` → `moderateReflection(response)` → continue existing save/unlock only when `allowed`.
- v1: client expanded blacklist from **leo-profanity** (+ simple `s` / `ing` / `er` forms); inline revise hint + underline; typed text preserved.
- Architecture ready for a future server pass inside `moderationService` without changing FocusView’s call shape.

### Anonymous auth

- Root `useAnonymousAuth`: ensure anonymous session, persist in AsyncStorage, recover stale JWT (sign out + new anonymous user).
- Splash waits on `fontsReady && !authLoading`.

### Breath unlock

- After first successful submit (online, offline queue, or handled duplicate), breath overlay covers navigation to tabs.
- `state/breathUnlock.ts` + root `BreathUnlockHost` + `BreathUnlockOverlay` — presentational settle to tab dock height.

### Fonts

- `FontPresetProvider` in root; **no remount `key` on preset/size** (avoids reshuffling gallery / resetting watermarks).
- `textStyles` Proxy rebuilds styles at read time from module active preset/size.
- Screens that render `textStyles` call **`useFontPresetSubscription()`** so they re-render (not remount) on cycle.
- Profile cycles via `FontPresetCycleButton`.

---

## What’s completed (recent / structuring)

- Feature folders: receive / reflect / today / community / cards / interactions / profile.
- Locked Today vs tabs Today split; breath unlock under-cover navigation.
- Shared reflection cards + hold actions; edit / delete / visibility wired (not placeholders).
- Journal + Community share `useReflectionCardMutations`; screen-owned policies remain separate.
- Community acknowledgements (flag-gated), presence/purpose UI.
- Client reflection moderation before save.
- Offline V1 queue + sync; anonymous auth with stale recovery.
- Font presets/sizes with subscription (no tree remount on cycle).
- Receive landing + Today recap; Reflect lenses + FocusView.

---

## Current bugs / risks

| Item | Severity | Notes |
|------|----------|--------|
| **Offline Journal has no history cache** | UX (by design V1) | Offline shows pending only; full history needs connection. |
| **`.env` required for Supabase** | Dev | Copy `.env.example` → `.env`; restart Expo after changes. |
| **Expo Go vs Reanimated/Worklets** | Runtime | Mismatch → TurboModule/worklets crash; align SDK / clear cache / dev build. |
| **Deep link / URL to Community while locked** | Low | **`useRedirectWhenTabsLocked`** sends user to Today. |
| **Optimistic delete / private exit** | Medium | Row removed before API; failure only logs — no restore. |
| **New screen forgetting font subscription** | Dev | `textStyles` can look stale until `useFontPresetSubscription()` is added. |
| **`post/[id].tsx` stub** | Low | Placeholder UI; not product-complete. |
| **No automated tests** | Process | No in-repo test runner at time of writing. |

---

## Next tasks (suggested backlog)

1. **Receive landing polish** — Motion tuning; optional “returning user” skip flag.

2. **Reflect / Today** — Product choice: back from Reflect to reset receive flow, or keep linear forward-only.

3. **Acknowledgements** — Optional server persistence for cross-device continuity (still reader-only; never public counts or author notification).

4. **Moderation** — Optional server pass inside `moderateReflection` (same result shape).

5. **Production linking / EAS** — Validate **`scheme`** with dev client builds.

6. **`post/[id].tsx`** — Implement or remove.

7. **Lint/format CI** — ESLint + CI if the team grows.

8. **Offline V2** (only if needed) — see out-of-scope in **`lib/OFFLINE_STATE.md`**.

---

## Developer shortcuts (`app.json`)

Use **`expo.extra.devStartAt`** to pick where the app opens during development. This saves time when you are iterating on one part of the flow.

**File:** `app.json` → `expo.extra`

```json
"extra": {
  "appEnv": "development",
  "devStartAt": "reflect"
}
```

**After any change to `app.json`, restart Metro:**

```bash
npx expo start --clear
```

### `devStartAt` tiers

| Value | Where you land | Use when |
|--------|----------------|----------|
| `"receive"` | `/(locked)` → **Receive** landing (quote, ponder, continue) | Testing the full daily onboarding from the top |
| `"reflect"` | `/(locked)` → **Reflect** (card stack; Receive skipped) | Testing reflect UI, focus transition, submit |
| `"mainTabs"` | `/(tabs)` → Today recap, Community, Profile | Testing post-unlock tabs without submitting a reflection |

**Omit `devStartAt`** (or set `appEnv` to `"production"`) to use the **normal daily gate**: main tabs only if the user completed Reflect today (`lastOnboardingDate` in AsyncStorage).

### How it is wired

| Piece | Role |
|--------|------|
| `state/onboardingGate.ts` | `resolveDevGateFlags()` reads `devStartAt` (dev / non-production only) |
| `state/TabAccessContext.tsx` | `mainTabs` tier unlocks tabs; `receive` / `reflect` keep the locked route |
| `components/today/TodayExperience.tsx` | `reflect` tier sets initial screen to Reflect instead of Receive |
| `app/index.tsx` | Redirects to `/(locked)` or `/(tabs)` from tab-access state |

### Production / App Store builds

- Set **`appEnv": "production"`** in release `app.json` / EAS config, or ensure **`devStartAt` is not set**.
- `resolveDevGateFlags()` always returns `startAt: null` in production — real users always get the daily onboarding gate.

### Legacy flags (avoid)

Older booleans still map for compatibility but prefer **`devStartAt`**:

- `forceOnboarding: true` → same as `"receive"`
- `forceMainTabs: true` → same as `"mainTabs"`

---

## Quick commands

```bash
npx expo start -c       # Metro + cache reset (does not clear auth AsyncStorage on device)
cp .env.example .env    # first-time Supabase setup (Windows: copy .env.example .env)
npx expo install <pkg>  # Expo-pinned versions
npx tsc --noEmit        # Typecheck
```

---

## Changelog-worthy context

- **SDK 54** chosen for Store **Expo Go** compatibility (vs brief SDK 55 experiment).
- **Material top tabs** at bottom for carousel-style horizontal navigation.
- **Tab swipe lock:** `withLayoutContext(..., true)` to avoid Expo injecting every `(tabs)` file as a route; explicit **`swipeEnabled`/`animationEnabled`** on every **`Tabs.Screen`**; **`useRedirectWhenTabsLocked`** on Community/Profile as a fallback.

---

*Update this file when architecture or major flows change.*
