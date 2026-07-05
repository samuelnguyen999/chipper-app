# ChipperApp

Expo (SDK 54) app. See `PROJECT_STATE.md` for architecture and `lib/SUPABASE_STATE.md` for backend setup.

## First-time setup

```bash
npm install
copy .env.example .env
```

Add your Supabase URL and key to `.env`, then:

```bash
npx expo start
```

`.env` is not committed. Never put secrets in git.

## Git (daily workflow)

```bash
git status              # see what changed
git add .               # stage changes (or add specific files)
git commit -m "message" # save a snapshot locally
git push                # upload to GitHub
```

Work on `main` in this repo from local dev through App Store releases. Each version is a new commit (and later, optional tags like `v1.0.0`).

## Before you commit

- Do **not** commit `.env`
- Run `npx tsc --noEmit` if you changed TypeScript

## Helpful commands

```bash
npx expo start --clear   # restart Metro (after .env changes)
npx tsc --noEmit         # typecheck
```
