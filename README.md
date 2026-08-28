# Chipper

Daily reflection app: Receive → Reflect → unlock Community / Profile / Journal. Anonymous users share optional public reflections.

**Stack:** Expo SDK 54 · Expo Router · React Native · Supabase (anonymous auth + `reflections`) · AsyncStorage (session, offline queue, onboarding gate)

**Start here for day-to-day work.** Architecture detail: `[PROJECT_STATE.md](PROJECT_STATE.md)`. Backend: `[lib/SUPABASE_STATE.md](lib/SUPABASE_STATE.md)`. Offline queue: `[lib/OFFLINE_STATE.md](lib/OFFLINE_STATE.md)`.

---

## How do I run Chipper?

```bash
npm install
copy .env.example .env.development   # first time — fill Chipper-app URL + key
copy .env.example .env.production    # first time — fill chipper-production URL + key

npm run start:dev          # normal development (Chipper-app)
npm run start:production   # same code, production Supabase
```

Do **not** rename or hand-edit `.env` files just to switch backends. Use the npm scripts.

---



## Which backend am I using?


| Command                    | Env file           | Supabase project              | Project ref            |
| -------------------------- | ------------------ | ----------------------------- | ---------------------- |
| `npm run start:dev`        | `.env.development` | **Chipper-app** (development) | `pgcsfhqwlsoomovjqjzt` |
| `npm run start:production` | `.env.production`  | **chipper-production**        | `cjpsdtzfuiimtwczwdux` |


Backend selection is **only** via:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Loaded by `scripts/expo-start-env.mjs` → `lib/supabase.ts`.

### `appEnv` is separate


| Control                  | Lives in                               | Purpose                               |
| ------------------------ | -------------------------------------- | ------------------------------------- |
| `appEnv` / `devStartAt`  | `app.json` → `expo.extra`              | Developer onboarding / gate shortcuts |
| `EXPO_PUBLIC_SUPABASE_*` | `.env.development` / `.env.production` | Which Supabase project                |


Changing backend **does not** change `appEnv`. Never implement Supabase selection through `appEnv`.

- `appEnv: "development"` → developer gate controls enabled (`devStartAt` works).
- `appEnv: "production"` → developer gate controls **disabled**; normal daily onboarding gate.
- Release / App Store builds must use `appEnv: "production"`.
- You may still set `appEnv` / `devStartAt` manually when intentionally testing onboarding states (existing workflow).

---



## Do I need `--clear`?

**Usually no extra step.** `npm run start:dev` and `npm run start:production` already start Expo with cache clear via `scripts/expo-start-env.mjs`.

You generally do **not** need:

```bash
npx expo start -c
```

If the wrong backend still appears after switching:

1. Stop Metro completely.
2. Run the correct npm command again (`start:dev` or `start:production`).
3. Only if still stale, use an explicit cache clear as troubleshooting — not every launch.

Restarting Metro with the right script is normally enough.

---



## How do I make a code update?

One repo. One `**main**` branch. Branches are not part of the V1 workflow.

```text
edit → test locally → npx tsc --noEmit → test → git add → git commit → git push origin main
```

Future App Store versions: commit on `main` → new EAS production build (optional tags later).

```bash
git status
git add .
git commit -m "message"
git push origin main
```

Never commit `.env`, `.env.development`, or `.env.production`.

---



## How do I make a database update?

Not every code change needs a migration.


| Kind     | Path                                                                  |
| -------- | --------------------------------------------------------------------- |
| App code | code → test → commit → EAS build                                      |
| Database | intentional migration → test in **development** → review → production |


- Do not casually change **production** schema.
- Use intentional Supabase migrations for schema changes.
- `supabase/migrations/20260816194026_remote_schema.sql` is a **historical / audit** pull from development — **not** a clean production migration. Do not treat it as the source of truth to re-apply blindly.
- App V1 needs `**public.reflections**` + RLS. `**reactions**`, `**test_auth_uid**`, and `**rls_auto_enable**` are not required by the app.

Details: `[lib/SUPABASE_STATE.md](lib/SUPABASE_STATE.md)`.

---



## How do I release a new version?

Intended flow (App Store work still in progress — see checklist):

```text
development testing
  → production-connected local testing (npm run start:production)
  → final production settings (appEnv=production, EAS prod env → chipper-production)
  → EAS production build
  → TestFlight
  → App Store submission
```

EAS: `eas.json` profiles `development` / `production` map to EAS environments. Production EAS env vars must point at **chipper-production** (`EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Secrets stay in EAS / local gitignored files — not in git.

---



## Current V1 status

**Implemented and verified against production Supabase:** anonymous sign-in, Receive → Reflect submit, reflections INSERT / own SELECT / UPDATE, public-private visibility, daily onboarding gate, Journal, Community, offline save + sync.


| Area         | V1 truth                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| Dev backend  | Chipper-app                                                                    |
| Prod backend | chipper-production                                                             |
| Table        | `public.reflections` + RLS (authenticated policies)                            |
| Auth         | Anonymous only                                                                 |
| Offline      | Queue in AsyncStorage; sync via `saveReflection`                               |
| Journal      | Online: remote + pending merge (prefer remote same day). Offline: pending only |
| Community    | Online-only (no offline cache)                                                 |


Architecture map and feature folders: `[PROJECT_STATE.md](PROJECT_STATE.md)`.

### Important folders


| Path          | Role                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `app/`        | Routes (locked Today, tabs, journal)                                   |
| `components/` | Today / Receive / Reflect / Community / Profile / cards / interactions |
| `lib/`        | Supabase client, reflections, offline queue, moderation                |
| `hooks/`      | Auth, offline sync, shared card mutations                              |
| `state/`      | Onboarding gate, tab access, breath unlock                             |
| `constants/`  | Design tokens, fonts                                                   |
| `supabase/`   | CLI config + migration history (audit)                                 |
| `scripts/`    | Logo sync, env-aware Expo start                                        |


---



## Secrets

- `.env.development` / `.env.production` — **gitignored**; real keys only here (or EAS).
- `.env.example` — placeholders only; safe to commit.
- Never commit Supabase keys.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon) is intentionally client-side.
- `**service_role` must never** be placed in the app or committed.

---



## Troubleshooting

**Dev app hits production (or the reverse)**  
Stop Metro → `npm run start:dev` or `npm run start:production`. If still wrong, stop again and rely on the script’s cache clear (or explicit clear only as last resort).

**Onboarding opens straight into tabs**  
`lastOnboardingDate` lives in **AsyncStorage** on the device. Switching Supabase backends does **not** reset it. Expected if you already completed Reflect today on this install.

**Auth / Metro**  
`npx expo start -c` (or the npm scripts’ built-in clear) resets Metro only — not phone AsyncStorage.

---



## V1 do not touch (casually)

Working surfaces — change only with intent and tests:

- `lib/supabase.ts`
- `saveReflection()` / `lib/reflections.ts`
- Anonymous auth flow (`hooks/useAnonymousAuth.ts`)
- Offline reflection queue (`lib/offlineReflections.ts`)
- Journal merge logic
- Community architecture
- Production Supabase schema
- RLS policies

---



## Release checklist (remaining App Store work)

Not complete until each item is done:

- [ ] Apple Developer Program
- [ ] App Store Connect app record
- [ ] Bundle identifier finalized
- [ ] `appEnv: "production"` for release builds
- [ ] EAS production environment → chipper-production credentials
- [ ] Privacy policy
- [ ] App Store privacy nutrition / questionnaire
- [ ] Community / UGC requirements (guidelines, reporting/moderation story as required)
- [ ] Production EAS build
- [ ] TestFlight
- [ ] App Store submission

---



## Typecheck

```bash
npx tsc --noEmit
```

Run before committing TypeScript changes.