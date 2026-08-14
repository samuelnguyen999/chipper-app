# AI handoff entry point

Start here, then read **`PROJECT_STATE.md`** for full stack, architecture, conventions, bugs, and backlog.

## Topic docs

| Topic | Doc |
|-------|-----|
| Supabase / auth / reflections APIs | `lib/SUPABASE_STATE.md` |
| Offline reflection queue (V1) | `lib/OFFLINE_STATE.md` |
| Reflect submit / unlock / moderation gate | `components/today/reflect/REFLECT_STATE.md` |
| Receive | `components/today/receive/RECEIVE_STATE.md` |
| Profile / Journal / gallery / fonts | `components/profile/PROFILE_STATE.md` |

## Current implementation notes (quick)

| Area | Truth in code |
|------|----------------|
| Card hold → actions | `resolveCardActions` + `CardInteractionProvider` + `CardExpandedActions`; edit surface stays on `ReflectionCard` |
| Journal / Community edit-delete-exit | Shared `hooks/useReflectionCardMutations.ts` (`beginEdit`, `saveEdit`, `startExit`, `finishExit`, `setEditDraft`); screens own visibility / acknowledge policy |
| Acknowledgements | Reader-only; `lib/acknowledgementService.ts`; flag `extra.acknowledgementsEnabled` |
| Moderation | Client v1 `lib/moderationService.ts` → `FocusView` before save; no server layer yet |
| Anonymous auth | `hooks/useAnonymousAuth.ts` at root; AsyncStorage session; stale JWT recovery |
| Breath unlock | `state/breathUnlock.ts` + `BreathUnlockHost` / `BreathUnlockOverlay` |
| Fonts | `FontPresetProvider` (no remount key on cycle); screens use `useFontPresetSubscription()`; `textStyles` Proxy |

This file exists so agents searching for `AI_CONTEXT.md` still land in the right workflow.
