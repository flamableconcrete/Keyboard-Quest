# HUD Overlay — Design Spec
**Date:** 2026-03-21

## Problem

Every level type and boss scene renders its own HUD elements (HP, timer, counter, level name, phase) independently, using inconsistent styling, positioning, and visual language. Some use emoji hearts, some use image hearts, some show no hearts at all. The WPM counter and typing hands are wired directly into `BaseLevelScene.preCreate()` rather than being part of a coherent overlay system.

## Goal

A single `LevelHUD` component that all level and boss scenes use. Every level gets the same visual overlay treatment: a dark top bar and bottom bar with gold border trim, containing standardised zones for HP, level info, timer, typing engine, finger hints, and WPM. Scenes configure which optional elements appear; the visual treatment is always the same.

---

## Visual Design

Two full-width panel bars rendered at fixed depth above the level scene:

- **Top bar** — dark near-black background (`#0a0814`, 85% opacity), 2px gold border (`#8a6a2a`) on the bottom edge
- **Bottom bar** — dark near-black background, 2px gold border on the top edge

### Top bar zones

| Zone | Content |
|------|---------|
| Top-left | "MENU" label (small, muted); hero HP hearts (full/empty images) below |
| Top-center | Level name (serif, cream `#d4b870`); phase indicator below (optional, boss only) |
| Top-right | ⏳ timer in gold (optional); counter "Label: X / Y" below in muted red (optional) |

### Bottom bar zones

| Zone | Content |
|------|---------|
| Bottom-center | Active word from TypingEngine (typed=green, current=white, remaining=dark) |
| Below word | Finger hints (TypingHands sub-component, shown only when `profile.showFingerHints`) |
| Bottom-right | WPM counter (blue-grey, updates every 500ms) |

### Heart style

Full/empty image hearts using the existing `heart_full` / `heart_empty` textures from `dungeonTrapArt.ts`. 3 hearts max. Empty hearts shown as dark silhouettes when HP is lost.

---

## Architecture

### New file: `src/components/LevelHUD.ts`

`LevelHUD` is a standalone class instantiated by each scene at the top of `create()`. It:

- Renders both panel bars using Phaser `Graphics` + `Text` objects
- Creates and owns the `TypingEngine` instance (moving it out of `BaseLevelScene.preCreate()`)
- Creates `TypingHands` when `profile.showFingerHints` is true (moving it out of `BaseLevelScene.preCreate()`)
- Manages the countdown timer internally (absorbing `setupLevelTimer()` / `setupBossTimer()`)
- Exposes update methods for scenes to call when game state changes

### Changes to `BaseLevelScene`

- `preCreate()` no longer creates `TypingEngine` or `TypingHands`
- `preCreate()` accepts the `LevelHUD` instance to wire `onWordComplete` / `onWrongKey` callbacks into `hud.engine`
- `setupLevelTimer()` removed — absorbed into `LevelHUD`
- `endLevel()` calls `this.hud.destroy()` instead of `this.engine.destroy()` + `this.typingHands?.fadeOut()`
- `this.engine` reference on `BaseLevelScene` replaced by `this.hud.engine`

### Changes to `BaseBossScene`

- `setupBossTimer()` removed — absorbed into `LevelHUD`
- Boss-specific engine font size passed via `HUDConfig.engineFontSize`
- `setupBossHP()` unchanged (pure state, not HUD)

---

## API

### `HUDConfig`

```typescript
interface HUDConfig {
  profileSlot: number               // for loading finger hint preference

  // Top-left
  heroHp: number                    // initial HP (1–3)

  // Top-center
  levelName: string
  phase?: { current: number; total: number }  // boss only

  // Top-right
  timer?: {
    seconds: number
    onExpire: () => void
    onTick?: (remaining: number) => void
  }
  counter?: {
    label: string                   // e.g. "Goblins Defeated", "Obstacles", "Orders"
    total: number
  }

  // Bottom bar — typing engine
  wordPool: string[]
  onWordComplete: (word: string, elapsed: number) => void
  onWrongKey: () => void
  engineFontSize?: number           // default: LEVEL_ENGINE_FONT_SIZE; boss scenes pass BOSS_ENGINE_FONT_SIZE
}
```

### `LevelHUD` class

```typescript
class LevelHUD {
  readonly engine: TypingEngine

  constructor(scene: Phaser.Scene, config: HUDConfig)

  setHeroHp(hp: number): void          // redraws hearts full/empty
  setPhase(current: number): void      // updates "Phase X / Y" text
  setCounter(completed: number): void  // updates "Label: X / Y" display
  destroy(): void                      // destroys all owned game objects
}
```

---

## Migration Per Scene

Each level and boss scene is updated as follows:

1. Remove all hand-rolled HUD `add.text()` calls for HP, timer, counter, level name, and phase
2. Remove heart image creation and update logic
3. Remove `setupLevelTimer()` / `setupBossTimer()` calls
4. Create `LevelHUD` at the top of `create()` with appropriate config
5. Store as `this.hud`; access typing engine via `this.hud.engine`
6. Call `preCreate()` after creating HUD
7. Replace state-update calls (`this.timerText.setText(...)`, etc.) with `this.hud.setHeroHp()`, `this.hud.setCounter()`, etc.

### Level scenes to migrate

All 13 level scenes in `src/scenes/level-types/` and all 12 boss scenes in `src/scenes/boss-types/`.

### Scenes with no current HP tracking

Scenes that don't currently track HP still show 3 full hearts — HP display is always present. The scene simply never calls `setHeroHp()`.

### HP visibility (world gating)

`DungeonPlatformerLevel` and `GoblinWhackerLevel` currently hide hearts in world 1 (non-advanced mode). With the unified HUD, hearts are always shown. World-gating of HP display is removed — the consistent overlay takes precedence.

---

## Scope Boundaries

**In scope:**
- `LevelHUD` component
- Migration of all 13 level scenes and 12 boss scenes
- Removal of `setupLevelTimer()` and `setupBossTimer()` from base classes
- Moving engine + typing hands creation from `preCreate()` into `LevelHUD`

**Out of scope:**
- Pause menu / `PauseScene` (the "MENU" label is cosmetic only — existing `setupPause()` is unchanged)
- Mobile scenes (`MobileLevelIntroScene`, `MobileOverlandMapScene`)
- `LevelResultScene` or any non-gameplay scene
- Boss HP bar (boss-side HP display stays in each boss scene — it's gameplay-specific, not a standard HUD zone)
- Vignette / low-HP screen flash effects (stay in scenes that use them)
