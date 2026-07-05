# SUPABASE_STATE.md

**Instructions for AI / new agents:** Backend wiring for Supabase Auth. Read with `PROJECT_STATE.md` before adding persistence, RLS, or reflection sync.

---

## Status

| Area | State |
|------|--------|
| Anonymous auth | **Done** — sign-in on cold start, session in AsyncStorage |
| Reflection sync | **Not started** — `ReflectionResponsesContext` still in-memory only |
| Database tables | **Not started** — no app tables wired yet |

---

## Files

| Path | Role |
|------|------|
| `lib/supabase.ts` | Singleton client; `AsyncStorage` session persistence; requires `EXPO_PUBLIC_*` env vars |
| `hooks/useAnonymousAuth.ts` | Root hook: `getSession` → `signInAnonymously` if needed → `getUser`; exposes `{ loading }` |
| `app/_layout.tsx` | Blocks render until `authLoading` and fonts are ready |
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
3. If the Users UI looks empty, run in **SQL Editor**:
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
5. Same anonymous `user.id` on relaunch until sign-out or app data cleared.

`npx expo start --clear` clears **Metro cache only**, not phone AsyncStorage.

In `__DEV__`, Metro logs `Anonymous user: <uuid>`.

---

## Dependencies

- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `react-native-url-polyfill` (imported first in `lib/supabase.ts`)

---

## Next steps (suggested)

1. Create `reflections` (or similar) table with RLS: `auth.uid() = user_id`
2. On reflect submit, `insert` row keyed to `supabase.auth.getUser()` id
3. Hydrate Community tab from Supabase instead of (or in addition to) `ReflectionResponsesContext`
4. Optional: link anonymous user to email/OAuth later via `updateUser` / `linkIdentity`

---

*Update when schema, RLS, or auth flow changes.*
