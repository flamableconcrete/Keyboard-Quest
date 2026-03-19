# Skeleton Swarm Wave Gating — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

SkeletonSwarm levels currently spawn new waves on a timer regardless of whether the previous wave has been cleared, and use a randomized wave count. This spec defines deterministic wave counts per level, strict wave gating (next wave only starts once all skeletons are defeated), and a between-wave banner.

---

## Requirements

1. Each SkeletonSwarm level has a pre-determined, fixed wave count (no randomization).
2. A new wave does not start until all skeletons from the current wave are defeated.
3. A text-only banner ("WAVE N") fades in center-screen, holds, then fades out before the next wave spawns.
4. Wave counts scale with world difficulty: World 1 = 3, World 2 = 4, World 4 = 4, World 5 = 5.
5. World 3 has no SkeletonSwarm level; no data change needed for World 3.

---

## Schema Change

Add optional field to `LevelConfig` in `src/types/index.ts`:

```ts
waveCount?: number  // for SkeletonSwarm levels; number of waves before victory
```

---

## Level Data

Set `waveCount` in each SkeletonSwarm `LevelConfig`:

| File         | World | waveCount |
|--------------|-------|-----------|
| `world1.ts`  | 1     | 3         |
| `world2.ts`  | 2     | 4         |
| `world4.ts`  | 4     | 4         |
| `world5.ts`  | 5     | 5         |

---

## SkeletonSwarmLevel Changes

### `init()`

Replace:

```ts
this.maxWaves = Phaser.Math.Between(3, 5)
```

With:

```ts
this.maxWaves = this.level.waveCount ?? 3
```

### Remove timer-based wave advancement

Remove the following four things:

1. `private waveTimer?: Phaser.Time.TimerEvent` field declaration (line ~44)
2. The `waveTimer` assignment block in `create()` (the `this.time.addEvent(...)` call)
3. The entire `onWaveTimer()` method
4. `this.waveTimer?.remove()` in `endLevel()` (line ~693)

### `checkWaveOrWin()` — new private method

```ts
private checkWaveOrWin() {
  if (this.finished || this.skeletons.length > 0) return
  if (this.currentWave < this.maxWaves) {
    this.showWaveBanner(this.currentWave + 1)
  } else {
    this.endLevel(true)
  }
}
```

`currentWave < maxWaves` is the correct discriminator for "more waves to spawn". The word queue is drained at spawn time (each `spawnSkeleton()` call shifts from it), so `wordQueue.length` is 0 by the time the last skeleton of any wave dies. `currentWave >= maxWaves` with an empty board is the correct terminal condition, regardless of `wordQueue` state.

### Call sites for `checkWaveOrWin()`

**`onWordComplete`** — Replace the trailing win-check with `checkWaveOrWin()`. It must be called *after* `setActiveSkeleton(next)`, not inside the `if (skeleton)` block:

```ts
// After the if (skeleton) block and after setActiveSkeleton(next):
this.checkWaveOrWin()
// Remove the old: if (this.wordQueue.length === 0 && this.skeletons.length === 0) this.endLevel(true)
```

The single `checkWaveOrWin()` call at the end of the method covers both the direct kill and any cleave kill that ran earlier in the same method, because both update `this.skeletons` before the check runs.

**`word_blast` spell handler** — Replace:

```ts
if (this.wordQueue.length === 0 && this.skeletons.length === 0) this.endLevel(true)
```

With:

```ts
this.checkWaveOrWin()
```

**`skeletonReachedPlayer`** — Add `checkWaveOrWin()` **after** the `if (this.playerHp <= 0) this.endLevel(false)` call, guarded by `!this.finished`. Placing it before the hp check risks calling `endLevel(true)` on the same frame as `endLevel(false)` when the player dies on the last skeleton; `endLevel` has an early-return guard on `this.finished` so only the first call takes effect, but correctness requires the loss check to run first:

```ts
// at end of skeletonReachedPlayer, after the hp check:
if (!this.finished) this.checkWaveOrWin()
```

### `showWaveBanner(waveNumber: number)` — new private method

```ts
private showWaveBanner(waveNumber: number) {
  const { width, height } = this.scale
  const banner = this.add.text(width / 2, height / 2, `WAVE ${waveNumber}`, {
    fontSize: '48px', color: '#ffd700', stroke: '#000000', strokeThickness: 5
  }).setOrigin(0.5).setDepth(200).setAlpha(0)

  this.tweens.add({
    targets: banner,
    alpha: 1,
    duration: 400,
    yoyo: true,
    hold: 1200,
    onComplete: () => {
      banner.destroy()
      this.spawnWave()
    }
  })
}
```

Called with `currentWave + 1` (the wave about to spawn). `spawnWave()` increments `currentWave` at its start, so banner text and HUD counter both show the correct wave number once spawning begins. Total inter-wave pause: ~2000ms (400ms fade-in + 1200ms hold + 400ms fade-out).

There is no banner before wave 1 — `spawnWave()` is called directly in `create()`. The `waveText` HUD counter updates inside `spawnWave()`, so during the banner it shows the previous wave number and updates when the new wave begins spawning. This is intentional.

### Input during banner

The typing engine remains active during the banner. Since no skeletons are on screen, `activeSkeleton` is null and the engine shows no word — no input is consumed.

---

## Files to Change

1. `src/types/index.ts` — add `waveCount?: number` to `LevelConfig`
2. `src/data/levels/world1.ts` — add `waveCount: 3`
3. `src/data/levels/world2.ts` — add `waveCount: 4`
4. `src/data/levels/world4.ts` — add `waveCount: 4`
5. `src/data/levels/world5.ts` — add `waveCount: 5`
6. `src/scenes/level-types/SkeletonSwarmLevel.ts`:
   - Replace randomized `maxWaves` with `this.level.waveCount ?? 3`
   - Remove `waveTimer` field, assignment in `create()`, `onWaveTimer()` method, and `waveTimer?.remove()` in `endLevel()`
   - Add `checkWaveOrWin()` private method
   - Add `showWaveBanner(waveNumber)` private method
   - In `onWordComplete`: replace trailing win-check with `checkWaveOrWin()` (after `setActiveSkeleton`)
   - In `word_blast` handler: replace win-check with `checkWaveOrWin()`
   - In `skeletonReachedPlayer`: add `if (!this.finished) this.checkWaveOrWin()` after the hp/loss check
