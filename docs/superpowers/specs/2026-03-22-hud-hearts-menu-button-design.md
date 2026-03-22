# HUD Hearts Spacing & Menu Button Design

## Problem

The top-left area of `LevelHUD` has two issues:

1. **Hearts overlap** — hearts are rendered at `setScale(2)` (48px wide each) but placed only 26px apart, causing significant overlap.
2. **"Esc to Pause" button** — `pauseSetup.ts` creates a `[ ESC to Pause ]` text button at y=60, below the HUD top bar, overlapping game content. The `MENU` label in `LevelHUD` is a passive non-interactive text element. These are two separate, redundant mechanisms for pause.

Additionally, the top-left section has no visual coherence with the top-right timer: the timer is a labeled, gold-colored element while the hearts section is unlabeled and mis-spaced.

## Design

### Top-left layout changes (LevelHUD)

All elements in the top-left vertically centered at y=28 (half of `HUD_TOP_BAR_H = 56`):

**`[ MENU ]` button** — replaces the passive `MENU` label
- Position: x=12, y=28, origin (0, 0.5)
- Style: `fontSize: '14px', color: '#c8a830'` (same gold as the timer)
- Interactive with hand cursor
- On `pointerover`: color `#ffd966` (lighter gold)
- On `pointerout`: color `#c8a830`
- On `pointerdown`: `scene.scene.pause()` → launch `PauseScene` → `bringToTop`

**`HP` label** — mirrors the timer's labeled-element style
- Position: x=84, y=28, origin (0, 0.5)
- Style: `fontSize: '13px', color: '#c8a830'`
- Static, non-interactive

**Hearts** — fixed spacing
- Start x=114, step=54px, y=28, scale=2, origin (0, 0.5)
- Texture is 24×18px at scale 2 → 48×36px rendered; step 54 gives a 6px gap between hearts
- `heart_full` / `heart_empty` textures unchanged

**ESC key** — moved into `LevelHUD`
- Add `scene.input.keyboard?.on('keydown-ESC', ...)` in the LevelHUD constructor, same logic as current `setupPause`

### pauseSetup.ts

- Remove the visual button creation and all pointer event handlers
- Remove the ESC key listener (now in LevelHUD)
- The function becomes a no-op stub (kept for import compatibility with `BaseLevelScene` and test mocks)

### BaseLevelScene.ts

- No change to the `setupPause(this, this.profileSlot)` call — the function now does nothing but the call can remain to avoid breaking test mocks

## Files Changed

- `src/components/LevelHUD.ts` — redesign top-left section
- `src/utils/pauseSetup.ts` — gut to no-op stub

## Out of Scope

- Timer position / styling (right side unchanged)
- Counter label / styling (right side unchanged)
- Heart textures themselves (pixel art unchanged)
- Boss scenes (all go through `BaseLevelScene` → `LevelHUD`, so changes apply automatically)
