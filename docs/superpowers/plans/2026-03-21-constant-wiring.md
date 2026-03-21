# Constant Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire SPAWN_OFFSCREEN_MARGIN, SKELETON_BARRIER_X, and DEFAULT_PLAYER_HP into their remaining call sites, eliminating the last hardcoded magic numbers.

**Architecture:** Pure constant substitution — no logic changes, no new abstractions. Each task: grep to confirm sites, replace literals, verify no literals remain, run tests, commit.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

---

## Task 1: SPAWN_OFFSCREEN_MARGIN

Wire `SPAWN_OFFSCREEN_MARGIN` (value: 30) into all 4 files that still use `width + 30` or `canvasWidth + 30` literals.

Confirmed sites:
- `src/scenes/level-types/GoblinWhackerLevel.ts` — lines 135, 136, 140 (`width + 30`)
- `src/scenes/level-types/SlimeSplittingLevel.ts` — line 57 (`width + 30`)
- `src/scenes/level-types/UndeadSiegeLevel.ts` — lines 70, 71, 75 (`width + 30`)
- `src/controllers/WaveController.ts` — line 83 (`canvasWidth + 30`)

- [ ] Grep to confirm all sites before editing:
  ```bash
  grep -n "width + 30\|canvasWidth + 30" \
    src/scenes/level-types/GoblinWhackerLevel.ts \
    src/scenes/level-types/SlimeSplittingLevel.ts \
    src/scenes/level-types/UndeadSiegeLevel.ts \
    src/controllers/WaveController.ts
  ```

- [ ] Edit `src/scenes/level-types/GoblinWhackerLevel.ts`:
  - Line 8 already imports from `../../constants`; add `SPAWN_OFFSCREEN_MARGIN` to the existing import:
    ```ts
    import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD, SPAWN_OFFSCREEN_MARGIN } from '../../constants'
    ```
  - Replace all 3 occurrences of `width + 30` with `width + SPAWN_OFFSCREEN_MARGIN`

- [ ] Edit `src/scenes/level-types/SlimeSplittingLevel.ts`:
  - Line 6 already imports from `../../constants`; add `SPAWN_OFFSCREEN_MARGIN` to the existing import:
    ```ts
    import { GOLD_PER_KILL, SPAWN_OFFSCREEN_MARGIN } from '../../constants'
    ```
  - Replace the 1 occurrence of `width + 30` with `width + SPAWN_OFFSCREEN_MARGIN`

- [ ] Edit `src/scenes/level-types/UndeadSiegeLevel.ts`:
  - Line 6 already imports from `../../constants`; add `SPAWN_OFFSCREEN_MARGIN` to the existing import:
    ```ts
    import { GOLD_PER_KILL, SPAWN_OFFSCREEN_MARGIN } from '../../constants'
    ```
  - Replace all 3 occurrences of `width + 30` with `width + SPAWN_OFFSCREEN_MARGIN`

- [ ] Edit `src/controllers/WaveController.ts`:
  - Line 4 already imports from `../constants`; add `SPAWN_OFFSCREEN_MARGIN` to the existing import:
    ```ts
    import { BATTLE_STOP_X, SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD, SPAWN_OFFSCREEN_MARGIN } from '../constants'
    ```
  - Replace the 1 occurrence of `canvasWidth + 30` with `canvasWidth + SPAWN_OFFSCREEN_MARGIN`

- [ ] Grep to verify no `width + 30` or `canvasWidth + 30` literals remain in these files:
  ```bash
  grep -n "width + 30\|canvasWidth + 30" \
    src/scenes/level-types/GoblinWhackerLevel.ts \
    src/scenes/level-types/SlimeSplittingLevel.ts \
    src/scenes/level-types/UndeadSiegeLevel.ts \
    src/controllers/WaveController.ts
  ```
  Expected: no output.

- [ ] Run tests:
  ```bash
  npm run test
  ```

- [ ] Commit all 4 files:
  ```
  refactor: replace width+30 literals with SPAWN_OFFSCREEN_MARGIN constant
  ```

---

## Task 2: SKELETON_BARRIER_X

Wire `SKELETON_BARRIER_X` (value: 265) into `src/scenes/level-types/SkeletonSwarmLevel.ts`, removing the local field declaration.

Confirmed sites in `SkeletonSwarmLevel.ts`:
- Line 44: `private readonly BARRIER_X = 265` (field to delete)
- Line 72: `barrierX: this.BARRIER_X`
- Line 159: `this.add.particles(this.BARRIER_X, 0, ...`
- Line 172: `this.add.particles(this.BARRIER_X, 0, ...`
- Line 414: `const bx = this.BARRIER_X`

- [ ] Read the file to confirm exact context around line 44 and all 5 usages:
  ```bash
  grep -n "BARRIER_X" src/scenes/level-types/SkeletonSwarmLevel.ts
  ```

- [ ] Edit `src/scenes/level-types/SkeletonSwarmLevel.ts`:
  - Line 8 already imports from `../../constants`; add `SKELETON_BARRIER_X` to the existing import:
    ```ts
    import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD, SKELETON_BARRIER_X } from '../../constants'
    ```
  - Delete line 44: `private readonly BARRIER_X = 265`
  - Replace all 4 occurrences of `this.BARRIER_X` with `SKELETON_BARRIER_X`

- [ ] Grep to verify no `this.BARRIER_X` or `BARRIER_X = 265` remain:
  ```bash
  grep -n "this\.BARRIER_X\|BARRIER_X = 265" src/scenes/level-types/SkeletonSwarmLevel.ts
  ```
  Expected: no output.

- [ ] Run tests:
  ```bash
  npm run test
  ```

- [ ] Commit:
  ```
  refactor: replace local BARRIER_X field with SKELETON_BARRIER_X constant
  ```

---

## Task 3: DEFAULT_PLAYER_HP

Wire `DEFAULT_PLAYER_HP` (value: 3) into `MonsterArenaLevel.ts` and `SlimeSplittingLevel.ts`, replacing the literal `3` in field declarations and init resets.

Confirmed sites:
- `src/scenes/level-types/MonsterArenaLevel.ts` — line 21 (`private playerHp = 3`) and line 30 (`this.playerHp = 3`)
- `src/scenes/level-types/SlimeSplittingLevel.ts` — line 21 (`private playerHp = 3`) and line 30 (`this.playerHp = 3`)

Note: `GoblinWhackerLevel.ts` and `SkeletonSwarmLevel.ts` already import `DEFAULT_PLAYER_HP` from constants.

- [ ] Grep to confirm sites before editing:
  ```bash
  grep -n "playerHp = 3" \
    src/scenes/level-types/MonsterArenaLevel.ts \
    src/scenes/level-types/SlimeSplittingLevel.ts
  ```

- [ ] Edit `src/scenes/level-types/MonsterArenaLevel.ts`:
  - Locate the existing constants import and add `DEFAULT_PLAYER_HP` (or add a new import if none exists)
  - Replace both occurrences of `= 3` on the `playerHp` field and reset lines with `= DEFAULT_PLAYER_HP`

- [ ] Edit `src/scenes/level-types/SlimeSplittingLevel.ts`:
  - Line 6 already imports from `../../constants`; add `DEFAULT_PLAYER_HP` to the existing import:
    ```ts
    import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SPAWN_OFFSCREEN_MARGIN } from '../../constants'
    ```
    (assuming Task 1 has already been applied; otherwise add alongside `GOLD_PER_KILL`)
  - Replace both occurrences of `= 3` on the `playerHp` field and reset lines with `= DEFAULT_PLAYER_HP`

- [ ] Grep to verify no `playerHp = 3` literals remain:
  ```bash
  grep -n "playerHp = 3" \
    src/scenes/level-types/MonsterArenaLevel.ts \
    src/scenes/level-types/SlimeSplittingLevel.ts
  ```
  Expected: no output.

- [ ] Run tests:
  ```bash
  npm run test
  ```

- [ ] Commit both files:
  ```
  refactor: replace playerHp literal 3 with DEFAULT_PLAYER_HP constant
  ```
