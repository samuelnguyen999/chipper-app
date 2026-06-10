# Profile tab — architecture reference

**Scope:** This folder implements the **Profile** tab scene: a scrollable **logo gallery** backed by images in **`assets/Logos`**. Wired from **`app/(tabs)/profile.tsx`** only.

**Audience:** Future agents and humans doing review or adaptation—read this before changing gallery layout, asset loading, or the full-screen viewer.

---

## Folder layout (importance order)

| Layer | Path | Responsibility |
|---|---|---|
| Asset manifest | `logoAssets.generated.ts` | **Auto-generated** — static `require()` per file in `assets/Logos`. Do not edit by hand. |
| Asset wrapper | `logoAssets.ts` | Re-exports `profileLogos` + `ProfileLogo` type; documents the sync workflow. |
| Grid tuning | `config.ts` | `profileGalleryLayout` (columns, tile aspect, padding). |
| UI | `LogoGallery.tsx` | `FlatList` grid, tap → modal full view, screen chrome copy. |
| Generator | `scripts/generate-logo-assets.mjs` | Node scan of `assets/Logos` → writes `logoAssets.generated.ts`. |
| Public API | `index.ts` | Default **`LogoGallery`**, layout + logo exports. |

**Design rule:** **`LogoGallery.tsx`** owns presentation only; the logo list comes from **`logoAssets.generated.ts`**, never hand-maintained `require()` blocks in feature code.

---

## Logo workflow (add / remove images)

Metro bundles images at **build time** — the app cannot scan `assets/Logos` on the device at runtime. Use the sync script instead:

1. **Drop images** in **`assets/Logos`** (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`).
2. **Run** `npm run sync:logos` — or **`npm start`**, which runs sync first.

The script sorts filenames alphabetically, derives **`label`** from the filename (without extension), and **`id`** as a slug. It overwrites **`logoAssets.generated.ts`**.

| Step | Command / path |
|---|---|
| Add or remove files | `assets/Logos/` |
| Regenerate manifest | `npm run sync:logos` |
| Start dev (includes sync) | `npm start` |
| Direct Expo CLI | Run `npm run sync:logos` yourself after changing logos if you use `npx expo start` |

**Filename tips:** Prefer lowercase `.png` extensions (Metro can fail on `.PNG`). Avoid odd casing in extensions.

---

## Gallery behavior

| Interaction | Behavior |
|---|---|
| Tab open | Scrollable 2-column grid (`profileGalleryLayout.columns`). |
| Tile tap | Modal fades in; image `resizeMode="contain"`. |
| Modal tap | Closes viewer. |

---

## Integration points (rest of app)

| Consumer | Usage |
|---|---|
| `app/(tabs)/profile.tsx` | Renders `<LogoGallery />`; `useRedirectWhenTabsLocked()` when tabs not unlocked for the day. |
| `package.json` | `"sync:logos"` script; `"start"` chains sync before `expo start`. |

No other routes import this folder today.

---

## Pros / cons (current state)

| Pros | Cons / risks |
|---|---|
| **Drop-in assets** — no manual `require()` list in components. | **Regenerate required** after logo folder changes (easy to forget with `npx expo start`). |
| **Generated file committed** — CI/build works without running the script if manifest is up to date. | **Not runtime-dynamic** — true folder scan on device is not possible in RN/Metro. |
| **Thin tab route** — profile screen stays a one-liner. | Large images affect bundle size; no lazy loading yet. |

---

## Future adaptations (recipes)

| Goal | Where to change |
|---|---|
| New logos | `assets/Logos` → `npm run sync:logos` |
| Grid columns / tile size | `config.ts` → `profileGalleryLayout` |
| Header copy | `LogoGallery.tsx` → `ListHeaderComponent` |
| Viewer chrome (backdrop, hint) | `LogoGallery.tsx` modal styles |
| Auto-sync on every `expo start` | Already on `npm start`; add hook to your CLI alias if needed |

---

## Review checklist (PRs touching Profile)

- [ ] If `assets/Logos` changed: `logoAssets.generated.ts` regenerated and committed.
- [ ] `npx tsc --noEmit` passes.
- [ ] New images use lowercase extensions where possible.
- [ ] `LogoGallery` still uses `profileLogos` from `logoAssets.ts`, not inline requires.

---

## Quick edit map

| Change | File |
|---|---|
| Add / remove logo files | `assets/Logos` + `npm run sync:logos` |
| Grid layout | `config.ts` |
| Gallery / modal UI | `LogoGallery.tsx` |
| Manifest generation rules | `scripts/generate-logo-assets.mjs` |

---

*Keep this file in sync when Profile gallery architecture or asset workflow changes.*
