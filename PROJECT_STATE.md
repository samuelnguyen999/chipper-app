# PROJECT_STATE.md

**Instructions for AI / new agents:** Read [`README.md`](README.md) first for run / backend / git / release workflow. This file is the architecture map for V1 (application code frozen for behavior unless intentionally changed).

---

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | **Expo SDK ~54** |
| Router | **Expo Router ~6** — file routes under `app/` |
| UI | **React Native 0.81.5**, **React 19.1** |
| Tabs | **@react-navigation/material-top-tabs** (bottom bar, swipeable) |
| Animations | **react-native-reanimated ~4.1** (+ worklets); Babel plugin **last** |
| Gestures | **react-native-gesture-handler**; root `GestureHandlerRootView` |
| Backend | **Supabase** — anonymous auth; see **`lib/SUPABASE_STATE.md`** |
| Local storage | **AsyncStorage** — auth session, fonts, visibility prefs, offline queue, acknowledgements, `lastOnboardingDate` |
| Connectivity | **@react-native-community/netinfo** |
| Client moderation | **leo-profanity** via **`lib/moderationService.ts` only** |

**Deep link scheme:** `app.json` → `expo.scheme`: `chipperapp`.

---

## V1 status (high level)

Implemented: Receive → Reflect → breath unlock → Community / Profile / Journal; anonymous auth; `reflections` + RLS; offline queue + sync; Journal merge; Community online-only; client moderation; card interactions + acknowledgements (flag-gated).

| Backend | Project | Ref |
|---------|---------|-----|
| Development | Chipper-app | `pgcsfhqwlsoomovjqjzt` |
| Production | chipper-production | `cjpsdtzfuiimtwczwdux` |

Run commands and env separation: **`README.md`**.

---

## Architecture (hierarchical)

### 1) Root shell and providers

| Path | Responsibility |
|---|---|
| `app/_layout.tsx` | Root `Stack`; auth + fonts gate splash; offline sync; `TabAccessProvider`, `FontPresetProvider`; `BreathUnlockHost`. |
| `app/index.tsx` | After hydration → `/(locked)` or `/(tabs)`. |

### 2) Route groups

| Route group | Responsibility |
|---|---|
| `/(locked)` | Pre-unlock Today (`TodayExperience`: Receive → Reflect). |
| `/(tabs)` | Post-unlock: Today recap, Community, Profile. |
| Other | Full Journal, stubs (`post/[id]`). |

### 3) Feature folders

| Feature | Folder | Detail doc |
|---|---|---|
| Today | `components/today/` | — |
| Receive | `components/today/receive/` | `RECEIVE_STATE.md` |
| Reflect | `components/today/reflect/` | `REFLECT_STATE.md` |
| Cards / interactions | `components/cards/`, `components/interactions/` | — |
| Community | `components/community/` | — |
| Profile / Journal | `components/profile/` | `PROFILE_STATE.md` |
| Supabase / offline | `lib/` | `SUPABASE_STATE.md`, `OFFLINE_STATE.md` |

### 4) Shared systems

| Area | Location |
|---|---|
| Tokens / fonts | `constants/`, `FontPresetContext` (+ `useFontPresetSubscription` on screens) |
| Reflections API | `lib/reflections.ts` |
| Offline queue | `lib/offlineReflections.ts` |
| Card list mutations | `hooks/useReflectionCardMutations.ts` |
| Onboarding / tabs gate | `state/onboardingGate.ts`, `state/TabAccessContext.tsx` |
| Breath unlock | `state/breathUnlock.ts` |
| Runtime extras | `app.json` → `extra.appEnv`, `devStartAt`, `acknowledgementsEnabled` |

---

## Cross-cutting behavior (do not casually rewrite)

### Card interactions

```
Screen → CardInteractionProvider → resolveCardActions → CardExpandedActions
ReflectionCard = inline edit + exit wipe
useReflectionCardMutations = beginEdit / saveEdit / startExit / finishExit
```

Journal: visibility in-place. Community make-private: exit wipe then API.

### Onboarding gate

- Daily unlock: `lastOnboardingDate` in AsyncStorage equals **today** (local calendar).
- Backend switch does **not** clear onboarding state.
- `appEnv` / `devStartAt`: see **README** and section below — **not** Supabase selection.

### Offline / Journal / Community

See **`lib/OFFLINE_STATE.md`**: queue → `saveReflection` on sync; Journal merges remote + pending; Community online-only.

### Auth

`useAnonymousAuth` at root; AsyncStorage session; stale JWT → signOut + new anonymous user.

### Moderation

`FocusView` → `moderateReflection` (client v1) → existing save path only if allowed.

---

## Developer gate controls (`app.json`)

**Workflow:** change `expo.extra` manually when testing onboarding states, then restart Metro (npm start scripts already clear cache).

```json
"extra": {
  "appEnv": "development",
  "devStartAt": "reflect"
}
```

| `appEnv` | Effect |
|----------|--------|
| `"development"` | Enables developer gate controls |
| `"production"` | Disables them — normal daily gate only |

| `devStartAt` (only if gates enabled) | Landing |
|--------|----------|
| `"receive"` | Locked → Receive |
| `"reflect"` | Locked → Reflect |
| `"mainTabs"` | Tabs without submitting |

Release builds: **`appEnv": "production"`**. Never use `appEnv` to choose Supabase.

Legacy (prefer `devStartAt`): `forceOnboarding` → receive; `forceMainTabs` → mainTabs.

Wiring: `resolveDevGateFlags()` → `TabAccessContext` / `TodayExperience` / `app/index.tsx`.

---

## Known V1 limitations / risks

| Item | Notes |
|------|--------|
| Offline Journal | Pending only; no historical cache |
| Optimistic delete / private exit | Row removed before API; failure logs only |
| `post/[id].tsx` | Stub |
| No automated tests | Process gap |
| Expo Go ↔ Reanimated | SDK mismatch → worklets crashes |

---

## V1 do not touch (casually)

Same list as **README**: `lib/supabase.ts`, `saveReflection`, anonymous auth, offline queue, Journal merge, Community architecture, production schema, RLS.

---

## Suggested backlog (post–behavior freeze)

App Store / EAS release checklist is in **README**. Optional product follow-ups: server moderation, acknowledgement sync, `post/[id]`, CI lint — only when intentionally unfreezing.

---

## Quick commands

```bash
npm run start:dev
npm run start:production
npx tsc --noEmit
```

Full workflow, secrets, troubleshooting, release checklist: **`README.md`**.

---

*Update when architecture or major flows change. Keep run/release instructions in README.*
