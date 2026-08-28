# Offline reflections (V1)

**Instructions for AI / new agents:** Pending-reflection queue while offline. Day-to-day run/backend: **`README.md`**. Also read `PROJECT_STATE.md`, `lib/SUPABASE_STATE.md`, and `components/profile/PROFILE_STATE.md`.

---

## Status

| Area | State |
|------|--------|
| Offline queue | **Done** — AsyncStorage via `lib/offlineReflections.ts` |
| Reflect offline submit | **Done** — network failures queue + unlock |
| Startup / reconnect sync | **Done** — `hooks/useOfflineReflectionSync.ts` (no UI, no timers) |
| Journal merge | **Done** — remote + pending; offline shows pending only |
| Community offline | **Done** — online-only; offline message on tab |
| Historical journal cache | **Not in V1** — Supabase remains sole history source |

---

## Files

| Path | Role |
|------|------|
| `lib/offlineReflections.ts` | **Only** AsyncStorage for the queue: `getOfflineReflections`, `addOfflineReflection`, `removeOfflineReflection`, `syncOfflineReflections`, `mergeReflectionsForJournal`, `isNetworkError` |
| `hooks/useOfflineReflectionSync.ts` | Sync after auth-ready mount; sync again on offline → online (`@react-native-community/netinfo`) |
| `app/_layout.tsx` | Mounts `<OfflineReflectionSync />` after auth/fonts |
| `components/today/reflect/Reflect.tsx` | Try `saveReflection`; on network/offline → queue + alert + unlock |
| `components/profile/Journal.tsx` | Merges Supabase + pending; offline notice on **full** Journal only |
| `app/(tabs)/community.tsx` | Offline copy; no Community cache |

Do **not** put AsyncStorage reflection writes outside `lib/offlineReflections.ts`.

---

## Queue rules

- Rows are `ReflectionRow`-shaped so Journal can render them like synced entries.
- **One pending reflection per `reflection_date`** — newer offline submit replaces same-day pending.
- Multiple dates may sit in the queue (Fri / Sat / Sun).
- Sync calls existing `saveReflection()`; success → remove from queue; failure → leave queued (silent).

Storage key: `chipper.offlineReflections`.

---

## Data flows

### Reflect submit

```
submit
  → online? saveReflection → unlock
  → offline / network error? addOfflineReflection → Alert → unlock
  → other errors? existing Reflect error UI (no unlock)
```

### Sync (background)

```
auth ready → syncOfflineReflections()
NetInfo offline → online → syncOfflineReflections()
```

No splash block, no sync screen, no polling/retry scheduler.

### Journal

| Connectivity | What Journal shows |
|--------------|-------------------|
| Online | Supabase history + pending merge (prefer remote for same date) |
| Offline | Pending queue only + full-Journal message: “Connect to view your full journal.” |
| Profile preview | Today’s card (incl. pending); **no** offline banner |

### Community

Online-only. Offline:

```
No internet.

Connect to see today's community.
```

---

## Auth note

Offline mode does **not** create a new anonymous user. Session restore stays in `useAnonymousAuth`; recreate only when Supabase reports a stale JWT.

---

## Dependencies

- `@react-native-async-storage/async-storage` (queue)
- `@react-native-community/netinfo` (connectivity)

---

## Out of scope (V1)

- Background jobs / WorkManager
- Retry timers
- Sync indicators in UI
- Caching full journal history on device
- Schema / RLS / `saveReflection()` changes

---

*Update when queue semantics or sync triggers change.*
