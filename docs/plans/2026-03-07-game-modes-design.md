# Game Modes Design

**Date:** 2026-03-07
**Status:** Approved

## Problem

1. **Bug:** In `GoblinWhackerLevel`, subsequent enemies cannot be typed after the first. Root cause: `goblinReachedPlayer` removes the active goblin but does not update `this.activeGoblin` to null. New goblins spawning thereafter skip auto-activation because the `!this.activeGoblin` guard is still false (pointing to a stale/destroyed object).

2. **Feature:** GoblinWhacker levels only support one real-time game mode. A beginner-friendly "regular" mode is needed. The mode should be profile-scoped (one setting for all levels) and editable mid-session via a settings menu on the overworld.

---

## Data Model

### `src/types/index.ts`

Add `gameMode` field to `ProfileData`:

```ts
gameMode: 'regular' | 'advanced'
```

### `src/utils/profile.ts`

- `createDefaultProfile` sets `gameMode: 'regular'`
- `loadProfile` migration guard: if a loaded profile is missing `gameMode`, default it to `'regular'` before returning

---

## Bug Fix

**File:** `src/scenes/level-types/GoblinWhackerLevel.ts`

In `goblinReachedPlayer`, after removing the goblin, check whether it was the active goblin. If so, call `setActiveGoblin(this.goblins[0] ?? null)` to advance to the next enemy immediately.

---

## Game Mode Behavior in GoblinWhackerLevel

`create()` reads `loadProfile(profileSlot).gameMode` and stores it as `private gameMode: 'regular' | 'advanced'`.

### Regular Mode (default)

- Up to 3–4 goblins visible on screen simultaneously, all marching toward the player.
- The lead goblin (leftmost / closest to player) stops at a fixed "battle position" X threshold and waits.
- Subsequent goblins slow and stop to maintain spacing — they never collide with the lead or reach the player.
- Only the lead goblin is typeable. It is visually highlighted (e.g. bright outline or distinct color).
- Defeating the lead advances the queue; the next goblin becomes the new lead and stops at the battle position.
- **No HP damage.** Goblins never reach the hero. The player can only fail via time limit (if the level has one).
- HP HUD is hidden in regular mode.
- The spawn timer continues to queue new goblins off-screen as the queue shrinks.

### Advanced Mode

- Current real-time behavior, unchanged.
- Goblins spawn on a 2500ms timer at random Y positions.
- Multiple goblins march simultaneously; if the lead reaches `maxGoblinReach` it damages the player.
- HP HUD visible. Player can lose from damage or time limit.

---

## SettingsScene

**New file:** `src/scenes/SettingsScene.ts`

- Registered in `src/main.ts` as `'Settings'`.
- Launched from `OverlandMapScene` via a `SETTINGS` button (top-right corner), passing `{ profileSlot }`.
- UI:
  - Title: `SETTINGS`
  - **Game Mode** row: two buttons `[ Regular ]` `[ Advanced ]`, active one highlighted.
  - Clicking/selecting a button saves `gameMode` to the profile immediately via `saveProfile`.
  - `← BACK` button returns to `OverlandMapScene` with `{ profileSlot }`.

---

## OverlandMapScene Changes

Add a `SETTINGS` text button (top-right) that calls:

```ts
this.scene.start('Settings', { profileSlot: this.profileSlot })
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `gameMode` to `ProfileData` |
| `src/utils/profile.ts` | Default + migration for `gameMode` |
| `src/scenes/level-types/GoblinWhackerLevel.ts` | Bug fix + regular/advanced mode logic |
| `src/scenes/SettingsScene.ts` | New scene |
| `src/scenes/OverlandMapScene.ts` | Add SETTINGS button |
| `src/main.ts` | Register SettingsScene |
