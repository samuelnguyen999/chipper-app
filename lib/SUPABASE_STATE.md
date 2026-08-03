# SUPABASE_STATE.md

**Instructions for AI / new agents:** Backend wiring for Supabase Auth and reflections. Read with `PROJECT_STATE.md` and `lib/OFFLINE_STATE.md` before changing persistence, RLS, or offline sync.

---

## Status

| Area | State |
|------|--------|
| Anonymous auth | **Done** — sign-in on cold start, session in AsyncStorage; stale JWT → signOut + new anonymous user |
| Reflection sync | **Done** — `lib/reflections.ts`; Supabase `reflections` table is the source of truth |
| Offline pending queue | **Done** — see **`lib/OFFLINE_STATE.md`** (AsyncStorage only for unsynced submits) |
| Database tables | **Wired** — `public.reflections` (dashboard); app uses insert + select helpers |

---

## Files

| Path | Role |
|------|------|
| `lib/supabase.ts` | Singleton client; `AsyncStorage` session persistence; requires `EXPO_PUBLIC_*` env vars |
| `lib/reflections.ts` | `saveReflection`, `getTodaysCommunity`, `getMyReflections`, `updateReflectionVisibility` — no AsyncStorage |
| `lib/offlineReflections.ts` | Pending queue + sync wrapper around `saveReflection` — see **`OFFLINE_STATE.md`** |
| `hooks/useAnonymousAuth.ts` | Root hook: `getSession` → anonymous sign-in if needed → `getUser`; recovers stale JWT |
| `hooks/useOfflineReflectionSync.ts` | Fire-and-forget sync after auth; reconnect sync |
| `app/_layout.tsx` | Blocks render until `authLoading` and fonts are ready; mounts offline sync |
| `.env` | Local secrets (gitignored). Copy from `.env.example` |
| `.env.example` | Committed template — no real keys |

---

## Environment

Expo loads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env` at build/start time.

**URL format:** `https://<project-ref>.supabase.co` — **no** `/rest/v1/` suffix.

**Keys:** Publishable (`sb_publishable_...`) or legacy JWT `anon` key from **Project Settings → API**. Both work with `@supabase/supabase-js` v2.

After changing `.env`, restart Metro: `npx expo start --clear`.

---

## Supabase dashboard (required)

1. **Authentication → Sign In / Providers**
   - Allow new users to sign up = **ON**
   - Allow anonymous sign-ins = **ON**
2. **Authentication → Users** — anonymous users have `is_anonymous: true`, provider `anonymous`
3. **`reflections` table** — app expects columns used by `ReflectionRow` / `saveReflection` (`user_id`, `card_type`, `question`, `response`, `is_public`, `reflection_date`, …)
4. **RLS (typical)**
   - Insert own: `auth.uid() = user_id`
   - Select public: `is_public = true`
   - Select own (Journal): `auth.uid() = user_id`
   - Update own (visibility toggle): `auth.uid() = user_id`
5. **Grants:** `GRANT SELECT, INSERT, UPDATE ON public.reflections TO authenticated;`
6. If the Users UI looks empty, run in **SQL Editor**:
   ```sql
   select id, is_anonymous, created_at from auth.users order by created_at desc limit 10;
   ```
   Confirm project ref in the dashboard URL matches `EXPO_PUBLIC_SUPABASE_URL`.

---

## Runtime behavior

1. App opens → `useAnonymousAuth` runs once in root layout.
2. `getSession()` reads persisted session from AsyncStorage (Expo Go on device).
3. No session → `signInAnonymously()` creates a server user.
4. `getUser()` validates the JWT with Supabase Auth.
5. Stale JWT (“user from sub claim does not exist”) → `signOut()` → new anonymous sign-in.
6. Same anonymous `user.id` on relaunch until sign-out, app data cleared, or stale recovery.
7. After auth ready → `syncOfflineReflections()` (non-blocking).

`npx expo start --clear` clears **Metro cache only**, not phone AsyncStorage.

In `__DEV__`, Metro logs `Anonymous user: <uuid>` (or recreated).

---

## Reflection APIs (`lib/reflections.ts`)

| Function | Role |
|----------|------|
| `saveReflection` | Insert for current user (online path + offline sync uploads) |
| `getTodaysCommunity` | Today’s public rows for Community |
| `getMyReflections` | Current user’s rows for Journal history |

Offline pending storage is **not** in this file — see `lib/offlineReflections.ts`.

---

## Dependencies

- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `react-native-url-polyfill` (imported first in `lib/supabase.ts`)
- `@react-native-community/netinfo` (connectivity for offline queue / Community)

---

## Next steps (suggested)

1. Optional: link anonymous user to email/OAuth later via `updateUser` / `linkIdentity`
2. Harden RLS / policies as product rules evolve
3. Offline V2 only if needed — see **`OFFLINE_STATE.md`** out-of-scope list

---

*Update when schema, RLS, or auth flow changes.*
