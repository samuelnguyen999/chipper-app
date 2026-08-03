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
| Local storage (auth) | **@react-native-async-storage/async-storage** — Supabase session persistence |



**Expo Go note:** Reanimated 4 + Worklets need an **Expo Go build that matches SDK 54**. Native `Worklets` / `installTurboModule` crashes → align Go ↔ SDK, `npx expo start -c`, or a **development build**.



---



## Architecture (hierarchical)

### 1) Root shell and providers

| Path | Responsibility |
|---|---|
| `app/_layout.tsx` | Root `Stack`; `useAnonymousAuth` + fonts gate splash; `OfflineReflectionSync`; wraps `TabAccessProvider`, `FontPresetProvider`. |
| `app/index.tsx` | Startup gate; redirects to `/(locked)` or `/(tabs)` after tab-access hydration. |

### 2) Route groups by app phase

| Route group | Responsibility | Primary files |
|---|---|---|
| `/(locked)` | Pre-unlock Today-only experience. | `app/(locked)/_layout.tsx`, `app/(locked)/index.tsx` |
| `/(tabs)` | Post-unlock tab shell (`index`, `community`, `profile`). | `app/(tabs)/_layout.tsx`, tab screens |
| Other app routes | Full Journal + fallbacks. | `app/journal.tsx`, `app/+not-found.tsx`, `app/post/[id].tsx` (placeholder) |

### 3) Navigation behavior and safeguards

| Concern | Where | Notes |
|---|---|---|
| Tab route registration | `app/(tabs)/_layout.tsx` | `withLayoutContext(..., true)` ensures only explicit `Tabs.Screen` entries are mounted. |
| Unlock transition | `components/today/reflect/Reflect.tsx` + `app/(locked)/index.tsx` | First valid reflection submit calls `unlockMainTabs()` and replaces to `/(tabs)`. |
| Locked-route fallback | `state/useRedirectWhenTabsLocked.ts` | Tabs screens redirect back to `/(locked)` if focused while locked. |

### 4) Feature boundaries

| Feature | Folder | Notes |
|---|---|---|
| Today (experience + recap) | `components/today/` | Hosts locked flow and post-unlock recap surface. |
| Receive | `components/today/receive/` | See **`RECEIVE_STATE.md`**. |
| Reflect | `components/today/reflect/` | See **`REFLECT_STATE.md`** (online + offline submit). |
| Shared cards | `components/cards/` | `ReflectionCard`, `CardShell`, `CardContainer` — Community/Journal adapters. |
| Community | `components/community/` | Today's public reflections; online-only. |
| Profile / Journal | `components/profile/` | Overview + gallery + Journal; see **`PROFILE_STATE.md`**. |

### 5) Shared modules and config surfaces

| Area | Location | Notes |
|---|---|---|
| UI token system | `constants/` | Colors, spacing/layout, typography, scene shells. |
| Supabase client + auth | `lib/supabase.ts`, `hooks/useAnonymousAuth.ts` | See **`lib/SUPABASE_STATE.md`**. |
| Reflections (online) | `lib/reflections.ts` | `saveReflection`, `getTodaysCommunity`, `getMyReflections`. |
| Offline queue | `lib/offlineReflections.ts`, `hooks/useOfflineReflectionSync.ts` | See **`lib/OFFLINE_STATE.md`**. |
| Visibility preference | `lib/reflectionPreferences.ts` | Device-local public/private default for Reflect. |
| Runtime app config | `app.json`, `babel.config.js` | Linking/scheme, **`devStartAt`**. |
| Package/runtime definitions | `package.json` | Includes NetInfo for connectivity. |
| Static assets | `assets/` | Icons, Logos, Merch, fonts. |

### 6) Detailed flow docs

- Receive: `components/today/receive/RECEIVE_STATE.md`
- Reflect: `components/today/reflect/REFLECT_STATE.md`
- Profile / Journal: `components/profile/PROFILE_STATE.md`
- Supabase / auth: `lib/SUPABASE_STATE.md`
- Offline reflections V1: `lib/OFFLINE_STATE.md`

**Gotcha:** Never pass a raw `{ screenOptions: ... }` object as a child of `<Stack>`; use `Stack.Screen` children and navigator props.




---



## What’s completed (recent / structuring)



- **Feature folders:** **`components/today/receive/`**, **`components/today/reflect/`**, **`components/today/`**, and **`components/community/`**.

- **Centralized scene styling:** **`constants/screen.ts`** + **`layout.*`** + **`textStyles.screenSubtitle`** aligned across Community, Reflect, Profile, **`reflect/parts/FocusView`**.

- **Receive landing:** Hero slide, quote fade, ponder band, **`ReceiveLandingPonderCtaSlot`** dock matched to tab bar height/safe area.

- **Pre-unlock isolation:** separate `/(locked)` route group hosts **TodayExperience** only; after first submit, `router.replace('/(tabs)')` enters full tabs.

- **Reflect:** Lenses under `components/today/reflect/`; submit → Supabase or offline queue; unlock after either path.

- **Shared cards:** `components/cards/` (`ReflectionCard` / `CardShell`); Community + Journal adapters.

- **Community:** Today's public rows via `getTodaysCommunity()`; offline message; no Community cache.

- **Profile / Journal:** Preview (today) + full `/journal`; merge pending offline; full Journal shows connect message when history unavailable.

- **Offline V1:** `lib/offlineReflections.ts` + reconnect/startup sync — see **`lib/OFFLINE_STATE.md`**.

- **Supabase anonymous auth:** Stale JWT recovery; sessions in AsyncStorage.

---

## Current bugs / risks

| Item | Severity | Notes |
|------|----------|--------|
| **Offline Journal has no history cache** | UX (by design V1) | Offline shows pending only; full history needs connection. |
| **`.env` required for Supabase** | Dev | Copy `.env.example` → `.env`; restart Expo after changes. |
| **Expo Go vs Reanimated/Worklets** | Runtime | Mismatch → TurboModule/worklets crash; align SDK / clear cache / dev build. |
| **Deep link / URL to Community while locked** | Low | **`useRedirectWhenTabsLocked`** sends user to Today. |
| **Root Stack `screenOptions` footgun** | Dev | Invalid extra children on `<Stack>` still a React pitfall. |
| **No automated tests** | Process | No in-repo test runner at time of writing. |

---

## Next tasks (suggested backlog)

1. **Receive landing polish** — Motion tuning; optional “returning user” skip flag.

2. **Reflect / Today** — Product choice: back from Reflect to reset receive flow, or keep linear forward-only.

3. **Card hold interactions** — hold → resolve → sheet; visibility via screen `handlers` → `updateReflectionVisibility`. Edit/delete/reactions still placeholders.

4. **Production linking / EAS** — Validate **`scheme`** with dev client builds.

5. **`post/[id].tsx`** — Implement or remove.

6. **Lint/format CI** — ESLint + CI if the team grows.

7. **Offline V2** (only if needed) — see out-of-scope in **`lib/OFFLINE_STATE.md`**.



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

- **Tab swipe lock:** `withLayoutContext(..., true)` to avoid Expo injecting every `(tabs)` file as a route; explicit **`swipeEnabled`/`animationEnabled`** on every **`Tabs.Screen`** (focused route’s options must not leave swipe **`undefined`** or TabView defaults to **swipe on**); **`useRedirectWhenTabsLocked`** on Community/Profile as a fallback.



---



*Update this file when architecture or major flows change.*


