# SUPABASE_STATE.md

**Instructions for AI / new agents:** Backend wiring for Supabase Auth and reflections. Run/backend switching: **`README.md`**. Offline queue: **`OFFLINE_STATE.md`**. Architecture: **`PROJECT_STATE.md`**.

---

## Status

| Area | State |
|------|--------|
| Anonymous auth | **Done** — cold start; AsyncStorage session; stale JWT → new anonymous user |
| Reflections | **Done** — `lib/reflections.ts`; `public.reflections` is source of truth |
| Offline pending | **Done** — `lib/offlineReflections.ts` |
| Production verification | Anonymous sign-in, INSERT / own SELECT / UPDATE, visibility, offline sync — verified on **chipper-production** |

---

## Projects

| Role | Name | Ref |
|------|------|-----|
| Development | Chipper-app | `pgcsfhqwlsoomovjqjzt` |
| Production | chipper-production | `cjpsdtzfuiimtwczwdux` |

| Local command | Env file |
|---------------|----------|
| `npm run start:dev` | `.env.development` |
| `npm run start:production` | `.env.production` |

`lib/supabase.ts` reads **only** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.  
**Never** select the project with `appEnv`.

Scripts use `scripts/expo-start-env.mjs` (`EXPO_NO_DOTENV=1` + `expo start -c`). Do not hand-edit env files for normal switching.

**EAS:** `eas.json` → environments `development` / `production`. Set the same two `EXPO_PUBLIC_*` vars in EAS; production must target **chipper-production**. No secrets in git.

---

## What the app needs (V1)

**Table:** `public.reflections`

- Columns: `id`, `user_id`, `card_type`, `question`, `response`, `is_public` (default false), `reflection_date`, `created_at` (default now)
- Unique `(user_id, reflection_date)`
- Check: `card_type` ∈ `ground` | `understand` | `align`
- RLS enabled

**Policies (role `authenticated`):** read own, read public (`is_public`), insert own, update own, delete own.

**Not required by the app:** `reactions`, `test_auth_uid()`, `rls_auto_enable()` / `ensure_rls`.

---

## Migrations in this repo

`supabase/migrations/20260816194026_remote_schema.sql` is a **historical `db pull` snapshot** from development (includes unused / infra objects). It is **audit material**, not a clean intentional production migration. Do not casually re-apply it. Future schema work: intentional migration → test on development → review → production.

Do not modify production schema casually.

---

## Files

| Path | Role |
|------|------|
| `lib/supabase.ts` | Client singleton — **do not casually change** |
| `lib/reflections.ts` | `saveReflection` and queries — **do not casually change** |
| `lib/offlineReflections.ts` | Pending queue + sync wrapper around `saveReflection` |
| `hooks/useAnonymousAuth.ts` | Root anonymous session |
| `hooks/useOfflineReflectionSync.ts` | Sync after auth / reconnect |
| `.env.development` / `.env.production` | Gitignored secrets |
| `.env.example` | Placeholders only |
| `eas.json` | EAS profile → environment mapping |

---

## Dashboard checklist (both projects)

1. Auth: allow sign-ups **ON**; anonymous sign-ins **ON**
2. `reflections` columns + RLS policies as above
3. Grants for app use: authenticated `SELECT` / `INSERT` / `UPDATE` / `DELETE` as needed by policies
4. Confirm dashboard project ref matches the env URL you launched with

**URL format:** `https://<project-ref>.supabase.co` (no `/rest/v1/` suffix).  
**Keys:** publishable or legacy anon from Project Settings → API. Never put **`service_role`** in the app.

---

## Runtime

1. Root → `useAnonymousAuth`
2. Session from AsyncStorage or `signInAnonymously`
3. Stale user JWT → signOut → new anonymous user
4. Then non-blocking `syncOfflineReflections()`

Metro cache clear ≠ clearing device AsyncStorage (auth + onboarding + offline queue).

In `__DEV__`, Metro may log `Anonymous user: <uuid>`.

---

## Reflection APIs (`lib/reflections.ts`)

| Function | Role |
|----------|------|
| `saveReflection` | Insert (online + offline sync) |
| `getTodaysCommunity` | Today’s public rows |
| `getMyReflections` | Journal history |
| Visibility / update / delete helpers | Own-row mutations |

---

## Secrets

Gitignore real env files. Commit only `.env.example`. Anon/publishable key is client-visible by design; **service_role never** in the client or repo.

---

*Update when schema, RLS, or auth flow changes. Keep daily run instructions in README.*
