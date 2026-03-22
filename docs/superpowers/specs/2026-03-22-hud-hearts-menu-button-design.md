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
- Guard against double-invocation: wrap the handler body in `if (!scene.scene.isPaused())`
- On `pointerover`: color `#ffd966` (lighter gold)
- On `pointerout`: color `#c8a830`
- On `pointerdown`: `if (!scene.scene.isPaused()) { scene.scene.pause(); scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot }); scene.scene.bringToTop('PauseScene') }`

**`HP` label** — mirrors the timer's labeled-element style
- Position: x=96, y=28, origin (0, 0.5)
- Style: `fontSize: '13px', color: '#c8a830'`
- Static, non-interactive
- x=96 provides ~24px clearance from the MENU button's right edge (~x=72), safe across font rendering variations

**Hearts** — fixed spacing (note: y moves from current y=38 to y=28 to vertically center in bar)
- Start x=124, step=54px, y=28, scale=2, origin (0, 0.5)
- Texture is 24×18px at scale 2 → 48×36px rendered; step 54 gives a 6px gap between hearts
- `heart_full` / `heart_empty` textures unchanged

**ESC key** — moved into `LevelHUD`
- Add `private _scene: Phaser.Scene` as an instance field (named `_scene` to avoid shadowing Phaser's `ScenePlugin` convention); assign in constructor: `this._scene = scene`
- Declare `private escHandler!: () => void` as an instance field
- Assign as a pre-bound arrow function with the same double-invocation guard:
  `this.escHandler = () => { if (!scene.scene.isPaused()) { scene.scene.pause(); scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot }); scene.scene.bringToTop('PauseScene') } }`
- Register: `scene.input.keyboard?.on('keydown-ESC', this.escHandler)` — `scene` captured by closure from constructor parameter
- `config.profileSlot` (already in `HUDConfig`) supplies the profile slot — no new constructor parameter needed
- `LevelHUD.destroy()` must call `this._scene.input.keyboard?.off('keydown-ESC', this.escHandler)` — because `escHandler` is a stored pre-bound arrow function (not a method), no context argument is needed for Phaser's `off()` to match it correctly

**Depth & pointer events**
- The `[ MENU ]` button must call `.setDepth(HUD_TEXT_DEPTH)` — the HUD background panel is `HUD_BG_DEPTH` (50) and text/images are `HUD_TEXT_DEPTH` (51), so no overlapping object blocks pointer events

### pauseSetup.ts

- Remove the visual button creation and all pointer event handlers
- Remove the ESC key listener (now in LevelHUD)
- The function becomes a no-op stub (kept for import compatibility with `BaseLevelScene` and test mocks)
- Making the function a no-op inherently removes the old anonymous ESC listener — no separate removal step is needed

### BaseLevelScene.ts

- No change to the `setupPause(this, this.profileSlot)` call — the function now does nothing but the call remains to avoid breaking test mocks
- Call order: `setupPause` is called first (does nothing), then LevelHUD is constructed inside the `options.hud` expression — this ordering is non-problematic since the old listener is gone

## Files Changed

- `src/components/LevelHUD.ts` — redesign top-left section
- `src/utils/pauseSetup.ts` — gut to no-op stub

## Out of Scope

- Timer position / styling (right side unchanged)
- Counter label / styling (right side unchanged)
- Heart textures themselves (pixel art unchanged)
- Boss scenes (all go through `BaseLevelScene` → `LevelHUD`, so changes apply automatically)
