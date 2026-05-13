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



**Expo Go note:** Reanimated 4 + Worklets need an **Expo Go build that matches SDK 54**. Native `Worklets` / `installTurboModule` crashes → align Go ↔ SDK, `npx expo start -c`, or a **development build**.



---



## Architecture (hierarchical)

### 1) Root shell and providers

| Path | Responsibility |
|---|---|
| `app/_layout.tsx` | Root `Stack`; wraps `ReflectionResponsesProvider` and `TabAccessProvider`; registers top-level groups/screens. |
| `app/index.tsx` | Startup gate; redirects to `/(locked)` or `/(tabs)` after tab-access hydration. |

### 2) Route groups by app phase

| Route group | Responsibility | Primary files |
|---|---|---|
| `/(locked)` | Pre-unlock Today-only experience. | `app/(locked)/_layout.tsx`, `app/(locked)/index.tsx` |
| `/(tabs)` | Post-unlock tab shell (`index`, `community`, `profile`). | `app/(tabs)/_layout.tsx`, tab screens |
| Other app routes | Fallback and future expansion. | `app/+not-found.tsx`, `app/post/[id].tsx` (placeholder) |

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
| Receive | `components/today/receive/` | `config`, `flow`, `landing`, `quotes/*`, `parts/*` — see **`RECEIVE_STATE.md`** for architecture, tradeoffs, and review checklist. |
| Reflect | `components/today/reflect/` | `config`, `Reflect.tsx`, `parts/*` — see **`REFLECT_STATE.md`** for architecture and review checklist. |
| Community | `components/community/` | Reads reflection responses and renders cards. |

### 5) Shared modules and config surfaces

| Area | Location | Notes |
|---|---|---|
| UI token system | `constants/` | Shared colors, spacing/layout, typography, and scene shells via barrel exports. |
| Runtime app config | `app.json`, `babel.config.js` | Linking/scheme + Babel plugin order (Reanimated plugin last). |
| Package/runtime definitions | `package.json` | Dependency versions and scripts. |
| Static assets | `assets/` | App icons/splash/media resources. |

### 6) Detailed flow docs

- Receive flow details: `components/today/receive/RECEIVE_STATE.md`
- Reflect flow details: `components/today/reflect/REFLECT_STATE.md`

**Gotcha:** Never pass a raw `{ screenOptions: ... }` object as a child of `<Stack>`; use `Stack.Screen` children and navigator props.




---



## What’s completed (recent / structuring)



- **Feature folders:** **`components/today/receive/`**, **`components/today/reflect/`**, **`components/today/`**, and **`components/community/`**.

- **Centralized scene styling:** **`constants/screen.ts`** + **`layout.*`** + **`textStyles.screenSubtitle`** aligned across Community, Reflect, Profile, **`reflect/parts/FocusView`**.

- **Receive landing:** Hero slide, quote fade, ponder band, **`ReceiveLandingPonderCtaSlot`** dock matched to tab bar height/safe area.

- **Pre-unlock isolation:** separate `/(locked)` route group hosts **TodayExperience** only; after first submit, `router.replace('/(tabs)')` enters full tabs.

- **Reflect:** Three lenses under `components/today/reflect/` — orchestration in **`Reflect.tsx`**, presentational **`parts/ChoiceCard`**, **`parts/FocusView`** (Reanimated entrance, submit on keyboard Done), shared **`parts/CardShell`**.

- **Community:** Lists submitted reflections via **`CommunityReflectionCard`**, reusing **`CardShell`** from **`components/today/reflect/parts/CardShell.tsx`** (direct import avoids loading **`Reflect`** when only the shell is needed).



Removed unused **`components/Receive.tsx`** and **`components/AppButton.tsx`** (nothing imported them). Use `components/today/*` feature modules and primitives from **`constants`** instead.



---



## Current bugs / risks



| Item | Severity | Notes |
|------|----------|--------|
| Reflection data **not persisted** | UX | In-memory only; lost on reload. |
| **Expo Go vs Reanimated/Worklets** | Runtime | Mismatch → TurboModule/worklets crash; align SDK / clear cache / dev build. |
| **Deep link / URL to Community while locked** | Low | **`useRedirectWhenTabsLocked`** sends user to Today; confirm UX if you rely on that URL. |
| **Root Stack `screenOptions` footgun** | Dev | Invalid extra children on `<Stack>` still a React pitfall if refactoring. |
| **No automated tests** | Process | No in-repo test runner at time of writing. |



---



## Next tasks (suggested backlog)



1. **Persist reflections** — AsyncStorage / MMKV / backend; hydrate **`ReflectionResponsesContext`** on startup.

2. **Receive landing polish** — Motion tuning; optional “returning user” skip flag.

3. **Reflect / Today** — Product choice: back from Reflect to reset receive flow, or keep linear forward-only.

4. **Production linking / EAS** — Validate **`scheme`** with dev client builds.

5. **`post/[id].tsx`** — Implement or remove.

6. **Profile** — Replace placeholder content.

7. **Lint/format CI** — ESLint + CI if the team grows.



---



## Quick commands



```bash

npx expo start -c       # Metro + cache reset

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


