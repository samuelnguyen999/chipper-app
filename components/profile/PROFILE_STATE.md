# Profile tab — architecture reference

**Scope:** Profile overview + Journal + logo/merch gallery. Wired from **`app/(tabs)/profile.tsx`**; full Journal from **`app/journal.tsx`**.

**Audience:** Future agents and humans doing review or adaptation—read this before changing Journal, gallery layout, or asset loading. Offline Journal rules: **`lib/OFFLINE_STATE.md`**.

---

## Folder layout (importance order)

| Layer | Path | Responsibility |
|---|---|---|
| Journal list | `Journal.tsx` | Loads Supabase + pending offline; preview vs full; Open → `/journal` |
| Journal adapter | `JournalReflectionCard.tsx` | `ReflectionRow` → `ReflectionCard`; optional visibility overlay (Profile today only) |
| Gallery UI | `LogoGallery.tsx` | Non-scrolling flexWrap grid (parent scroll owns scroll); “Gallery” subtitle when embedded; tap → modal |
| Asset manifest | `logoAssets.generated.ts` | **Auto-generated** — static `require()` for Logos + Merch. Do not edit by hand. |
| Asset wrapper | `logoAssets.ts` | Re-exports `profileLogos` + `ProfileLogo` type; sync workflow. |
| Grid tuning | `config.ts` | `profileGalleryLayout` (columns, tile aspect, padding). |
| Fonts | `FontPresetContext.tsx`, `FontPresetCycleButton.tsx` | App-wide font/size presets (`FontPresetProvider` in root; no remount key on cycle; screens subscribe via `useFontPresetSubscription`). |
| Generator | `scripts/generate-logo-assets.mjs` | Scan assets → `logoAssets.generated.ts`. |
| Public API | `index.ts` | `LogoGallery`, `Journal`, font exports. |

**Design rule:** Profile tab uses **one** `ScrollView` (Community pattern): header → Journal preview → embedded gallery. No nested scroll.

---

## Profile screen structure

```
app/(tabs)/profile.tsx
  ScrollView
    header ("Profile" + FontPresetCycleButton)
    <Journal preview />     // today's card + Open
    <LogoGallery embedded />
```

```
app/journal.tsx
  Stack header + ScrollRail
    <Journal />             // full history; relative date groups; offline connect message when needed
```

---

## Journal behavior

| Mode | Data | Offline UI |
|------|------|------------|
| **Preview** (`preview`) | Today’s reflection only (remote or pending) | No offline banner; pending today still shows |
| **Full** (`/journal`) | All remote + pending merge, grouped by recency | Pending only + “Connect to view your full journal.” |

**Full-journal groups** (Sunday→Saturday weeks; headers use `textStyles.screenSubtitle`):

| Group | Window |
|-------|--------|
| This week | Current week Sunday → today |
| Last week | Previous Sunday → previous Saturday |
| Last month | Older than last week, within ~30 days |
| Last year | Older than that |

Empty groups are omitted.

- Supabase = sole **historical** source (no journal history cache).
- AsyncStorage pending = `getOfflineReflections()` until sync.
- Cards: `JournalReflectionCard` → shared `components/cards/ReflectionCard` (lens-colored border via `lensTypeFromCardType`).
- Visibility globe/lock overlay: **preview / today’s card only**.
- Full journal scroll chrome: **`components/ui/ScrollRail.tsx`** (same pattern as Community).
---

## Logo workflow (add / remove images)

Metro bundles images at **build time**. Use the sync script:

1. Drop images in **`assets/Logos`** and/or **`assets/Merch`**.
2. Run **`npm run sync:logos`** — or **`npm start`** (syncs first).

| Step | Command / path |
|---|---|
| Add or remove files | `assets/Logos/`, `assets/Merch/` |
| Regenerate manifest | `npm run sync:logos` |
| Start dev (includes sync) | `npm start` |

**Filename tips:** Prefer lowercase extensions (Metro can fail on `.PNG`). Uppercase `.JPG` is allowlisted in `metro.config.js` when needed.

---

## Gallery behavior

| Interaction | Behavior |
|---|---|
| Profile scroll | Gallery is part of the Profile `ScrollView` (`embedded`). |
| Tile tap | Modal fades in; image `resizeMode="contain"`. |
| Modal tap | Closes viewer. |
| Order | Shuffled once per mount. |

---

## Integration points (rest of app)

| Consumer | Usage |
|---|---|
| `app/(tabs)/profile.tsx` | Overview: Journal preview + gallery. |
| `app/journal.tsx` | Full Journal route (`router.push("/journal")`). |
| `lib/reflections.ts` / `lib/offlineReflections.ts` | Journal data sources. |
| `components/cards/` | Shared reflection card chrome. |
| `package.json` | `"sync:logos"`; `"start"` chains sync. |

---

## Pros / cons (current state)

| Pros | Cons / risks |
|---|---|
| **Single scroll** — matches Community feel. | Offline full Journal cannot show past synced history (by design V1). |
| **Thin adapters** — Supabase types stay out of shared card UI. | Regenerate logo manifest after asset folder changes. |
| **Pending offline** still visible in preview/full. | Large gallery assets grow bundle size. |

---

## Future adaptations (recipes)

| Goal | Where to change |
|---|---|
| New logos / merch | assets folders → `npm run sync:logos` |
| Grid columns / tile size | `config.ts` → `profileGalleryLayout` |
| Journal load / merge | `Journal.tsx` + `lib/offlineReflections.ts` |
| Card appearance | `components/cards/ReflectionCard.tsx` |
| Visibility overlay | `JournalReflectionCard.tsx` |

---

## Review checklist (PRs touching Profile)

- [ ] If assets changed: `logoAssets.generated.ts` regenerated and committed.
- [ ] Profile still has one scroll owner (no nested `FlatList` scroll).
- [ ] Offline banner only on full Journal, not Profile preview.
- [ ] `npx tsc --noEmit` passes.

---

## Quick edit map

| Change | File |
|---|---|
| Profile layout | `app/(tabs)/profile.tsx` |
| Journal list / groups / offline message | `Journal.tsx` |
| Full journal scroll rail | `app/journal.tsx` + `components/ui/ScrollRail.tsx` |
| Card adapter / lock-globe | `JournalReflectionCard.tsx` |
| Gallery / modal | `LogoGallery.tsx` |
| Logo assets | `assets/*` + `npm run sync:logos` |

---

*Keep this file in sync when Profile / Journal architecture changes.*
