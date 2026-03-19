# Skeleton Swarm Wave Gating Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace timer-based random waves in SkeletonSwarm levels with event-driven wave gating, fixed per-level wave counts, and a between-wave banner.

**Architecture:** Add `waveCount` to `LevelConfig`, set it in each world's data file, then rework `SkeletonSwarmLevel` to gate waves on skeleton death events rather than a timer. Two new private methods — `checkWaveOrWin()` and `showWaveBanner()` — replace the old `onWaveTimer()`.

**Tech Stack:** TypeScript, Phaser 3, Vitest (tests)

---

## Chunk 1: Schema, data, and scene logic

### Task 1: Add `waveCount` to `LevelConfig` and set values in world files

**Files:**
- Modify: `src/types/index.ts` (around line 103 — after `maxWalkoffs`)
- Modify: `src/data/levels/world1.ts` (SkeletonSwarm entry, around line 147)
- Modify: `src/data/levels/world2.ts` (SkeletonSwarm entry, around line 14)
- Modify: `src/data/levels/world4.ts` (SkeletonSwarm entry, around line 94)
- Modify: `src/data/levels/world5.ts` (SkeletonSwarm entry, around line 94)

- [ ] **Step 1: Add `waveCount` field to `LevelConfig` in `src/types/index.ts`**

  Find the existing optional fields near the bottom of `LevelConfig`:
  ```ts
  orderQuota?: number       // for CrazedCook: orders needed to win
  maxWalkoffs?: number      // for CrazedCook: max angry walk-offs before losing
  ```
  Add below `maxWalkoffs`:
  ```ts
  waveCount?: number        // for SkeletonSwarm: number of waves before victory
  ```

- [ ] **Step 2: Set `waveCount` in world1.ts**

  In the SkeletonSwarm `LevelConfig` entry in `src/data/levels/world1.ts`, add `waveCount: 3` after `wordCount`:
  ```ts
  wordCount: 25,
  waveCount: 3,
  ```

- [ ] **Step 3: Set `waveCount` in world2.ts**

  In the SkeletonSwarm entry in `src/data/levels/world2.ts`:
  ```ts
  wordCount: 20,
  waveCount: 4,
  ```

- [ ] **Step 4: Set `waveCount` in world4.ts**

  In the SkeletonSwarm entry in `src/data/levels/world4.ts`:
  ```ts
  wordCount: 35,
  waveCount: 4,
  ```

- [ ] **Step 5: Set `waveCount` in world5.ts**

  In the SkeletonSwarm entry in `src/data/levels/world5.ts`:
  ```ts
  wordCount: 40,
  waveCount: 5,
  ```

- [ ] **Step 6: Verify TypeScript compiles cleanly**

  Run: `npm run build`
  Expected: No type errors. The `waveCount` field is optional so all other `LevelConfig` usages are unaffected.

- [ ] **Step 7: Commit**

  ```bash
  git add src/types/index.ts src/data/levels/world1.ts src/data/levels/world2.ts src/data/levels/world4.ts src/data/levels/world5.ts
  git commit -m "feat: add waveCount to LevelConfig and set per SkeletonSwarm level"
  ```

---

### Task 2: Replace randomized `maxWaves` and remove timer in `SkeletonSwarmLevel`

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 1: Replace randomized `maxWaves` in `init()`**

  In `init()` (around line 76), replace:
  ```ts
  this.maxWaves = Phaser.Math.Between(3, 5)
  ```
  With:
  ```ts
  this.maxWaves = this.level.waveCount ?? 3
  ```

- [ ] **Step 2: Remove `waveTimer` field declaration**

  Remove line ~44:
  ```ts
  private waveTimer?: Phaser.Time.TimerEvent
  ```

- [ ] **Step 3: Remove `waveTimer` assignment in `create()`**

  In `create()`, remove the entire `this.waveTimer = this.time.addEvent(...)` block (around lines 306–311):
  ```ts
  this.waveTimer = this.time.addEvent({
    delay: 5000,
    loop: true,
    callback: this.onWaveTimer,
    callbackScope: this,
  })
  ```

- [ ] **Step 4: Remove `onWaveTimer()` method**

  Delete the entire `private onWaveTimer()` method (lines ~314–341).

- [ ] **Step 5: Remove `this.waveTimer?.remove()` from `endLevel()`**

  In `endLevel()` (around line 693), remove:
  ```ts
  this.waveTimer?.remove()
  ```

- [ ] **Step 6: Verify TypeScript compiles cleanly**

  Run: `npm run build`
  Expected: No errors. The `waveText` HUD and `spawnWave()` still exist and are called correctly.

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/level-types/SkeletonSwarmLevel.ts
  git commit -m "feat: remove timer-based wave advancement from SkeletonSwarmLevel"
  ```

---

### Task 3: Add `checkWaveOrWin()` and wire it to all skeleton-removal paths

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 1: Add `checkWaveOrWin()` private method**

  Add after the existing `removeSkeleton()` method (around line 688):
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

  **Why `currentWave < maxWaves` not `wordQueue.length > 0`:** The word queue is drained at spawn time — every `spawnSkeleton()` call shifts a word off the queue. By the time the last skeleton in a wave dies, the queue is already empty. `currentWave < maxWaves` is the correct check for remaining waves.

- [ ] **Step 2: Update `onWordComplete` — replace trailing win-check**

  In `onWordComplete` (around line 642), the current code ends with:
  ```ts
  const next = this.skeletons[0] ?? null
  this.setActiveSkeleton(next)
  // Win check here covers cleave kills that empty the board
  if (this.wordQueue.length === 0 && this.skeletons.length === 0) {
    this.endLevel(true)
    return
  }
  ```
  Replace with:
  ```ts
  const next = this.skeletons[0] ?? null
  this.setActiveSkeleton(next)
  this.checkWaveOrWin()
  ```
  The `checkWaveOrWin()` call must come **after** `setActiveSkeleton(next)`. It covers both direct kills and any cleave kill that ran earlier in the same method, since both update `this.skeletons` before this point.

- [ ] **Step 3: Update `word_blast` spell handler — replace win-check**

  In the `word_blast` block inside the spell effect callback (around line 279), replace:
  ```ts
  if (this.wordQueue.length === 0 && this.skeletons.length === 0) this.endLevel(true)
  ```
  With:
  ```ts
  this.checkWaveOrWin()
  ```

- [ ] **Step 4: Update `skeletonReachedPlayer` — add wave-gate check**

  At the end of `skeletonReachedPlayer()` (around line 541), after:
  ```ts
  if (this.playerHp <= 0) this.endLevel(false)
  ```
  Add:
  ```ts
  if (!this.finished) this.checkWaveOrWin()
  ```
  The `!this.finished` guard prevents calling `endLevel(true)` after `endLevel(false)` has already fired when the player dies on the last skeleton.

- [ ] **Step 5: Verify TypeScript compiles cleanly**

  Run: `npm run build`
  Expected: No errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/scenes/level-types/SkeletonSwarmLevel.ts
  git commit -m "feat: add event-driven wave gating via checkWaveOrWin()"
  ```

---

### Task 4: Add `showWaveBanner()` between-wave banner

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 1: Add `showWaveBanner()` private method**

  Add after `checkWaveOrWin()`:
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

  This creates a "WAVE N" text centered on screen, fades it in over 400ms, holds for 1200ms, fades back out over 400ms (~2000ms total), then destroys it and spawns the next wave. There is no banner before wave 1 — `spawnWave()` is called directly in `create()`.

- [ ] **Step 2: Verify TypeScript compiles cleanly**

  Run: `npm run build`
  Expected: No errors.

- [ ] **Step 3: Run tests**

  Run: `npm run test`
  Expected: All tests pass. (The wave logic changes are in a Phaser scene that isn't unit-tested directly; the build check is the primary verification gate here.)

- [ ] **Step 4: Commit**

  ```bash
  git add src/scenes/level-types/SkeletonSwarmLevel.ts
  git commit -m "feat: add between-wave WAVE N banner in SkeletonSwarmLevel"
  ```

---

### Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server**

  Run: `npm run dev`

- [ ] **Step 2: Play a SkeletonSwarm level and verify behaviour**

  Navigate to any SkeletonSwarm level (World 1 has one after the first mini-boss). Verify:
  - [ ] Wave 1 starts immediately with no banner
  - [ ] HUD shows "Wave 1 / 3" (World 1)
  - [ ] After defeating all skeletons in wave 1, the `WAVE 2` banner appears center-screen, fades in/holds/fades out (~2 seconds), then wave 2 begins
  - [ ] No new wave spawns while any skeleton is still alive
  - [ ] After defeating all waves, the level ends with a win (LevelResult screen)
  - [ ] Player death still triggers loss correctly

- [ ] **Step 3: Verify World 2 SkeletonSwarm shows "Wave 1 / 4"**

  The HUD wave counter should reflect 4 waves total in World 2.
