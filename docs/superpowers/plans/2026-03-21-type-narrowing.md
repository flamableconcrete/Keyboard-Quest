# Type Narrowing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire SiegeLevelConfig into UndeadSiegeLevel (making castleHp data-driven) and apply TimedLevelConfig/OrderLevelConfig to 6 remaining timed level scenes.

**Architecture:** Additive type safety — narrowed init signatures surface missing data at compile time. The only runtime change is castleHp becoming data-driven in UndeadSiegeLevel. CrazedCookLevel data files need fixes before narrowing can be applied.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run `npm run build` to check types, `npm run test` to confirm no regressions

---

## Existing type definitions (confirmed in `src/types/index.ts`)

```ts
/** Config for wave-based levels (SkeletonSwarm, UndeadSiege, etc.) */
export interface WaveLevelConfig extends LevelConfig {
  waveCount: number
}

/** Config for timed levels (GoblinWhacker, CrazedCook, etc.) */
export interface TimedLevelConfig extends LevelConfig {
  timeLimit: number
}

/** Config for order-quota levels (CrazedCook) */
export interface OrderLevelConfig extends TimedLevelConfig {
  orderQuota: number
}

/** Config for siege levels with castle HP (UndeadSiege) */
export interface SiegeLevelConfig extends WaveLevelConfig {
  castleHp: number
}
```

All four interfaces already exist and require no changes.

---

## Task 1: UndeadSiegeLevel + SiegeLevelConfig

**Files to edit:**
- `src/data/levels/world2.ts` — entry `w2_l3` (Bloodmoss Path, `type: 'UndeadSiege'`)
- `src/data/levels/world3.ts` — entry `w3_l2` (Ashwood Cemetery, `type: 'UndeadSiege'`)
- `src/data/levels/world4.ts` — entry `w4_l2` (The Drowned Moor, `type: 'UndeadSiege'`)
- `src/scenes/level-types/UndeadSiegeLevel.ts`

### Steps

- [ ] **world2.ts** — in `w2_l3`, add `castleHp: 5` and `waveCount: 3` after `timeLimit`:
  ```ts
  timeLimit: 110,
  castleHp: 5,
  waveCount: 3,
  ```
  Note: `SiegeLevelConfig extends WaveLevelConfig` which requires `waveCount`. Current entry has no `waveCount`. Use `3` (matches the hardcoded `private maxWaves = 3` in the scene).

- [ ] **world3.ts** — in `w3_l2`, add `castleHp: 5` and `waveCount: 3` after `timeLimit`:
  ```ts
  timeLimit: 120,
  castleHp: 5,
  waveCount: 3,
  ```

- [ ] **world4.ts** — in `w4_l2`, add `castleHp: 5` and `waveCount: 3` after `timeLimit`:
  ```ts
  timeLimit: 130,
  castleHp: 5,
  waveCount: 3,
  ```

- [ ] **UndeadSiegeLevel.ts** — update import and init signature:

  Change import:
  ```ts
  import { LevelConfig } from '../../types'
  ```
  To:
  ```ts
  import { SiegeLevelConfig } from '../../types'
  ```

  Change init signature from:
  ```ts
  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.undeadsDefeated = 0
    this.castleHp = 5
  ```
  To:
  ```ts
  init(data: { level: SiegeLevelConfig; profileSlot: number }) {
    super.init(data)
    this.undeadsDefeated = 0
    this.castleHp = data.level.castleHp
  ```

  Also remove the `private castleHp = 5` class field initializer — change it to:
  ```ts
  private castleHp = 0
  ```
  (It will always be set in `init` from data, so 0 is a safe sentinel.)

- [ ] Run `npm run build` — confirm no type errors
- [ ] Commit: `feat: wire SiegeLevelConfig into UndeadSiegeLevel, add castleHp to world data`

---

## Task 2: CrazedCook data fix

**Problem:** `w4_l7` (The Jester's Glade) and `w5_l6` (The Mad King's Court) both have `timeLimit: null` and no `orderQuota`. `OrderLevelConfig` requires both `timeLimit: number` (not null) and `orderQuota: number`. These must be fixed in data before the scene can use the narrowed type.

**Files to edit:**
- `src/data/levels/world4.ts` — entry `w4_l7`
- `src/data/levels/world5.ts` — entry `w5_l6`

### Steps

- [ ] **world4.ts** — in `w4_l7` (The Jester's Glade), replace:
  ```ts
  timeLimit: null,
  ```
  With:
  ```ts
  timeLimit: 120,
  orderQuota: 8,
  maxWalkoffs: 3,
  ```

- [ ] **world5.ts** — in `w5_l6` (The Mad King's Court), replace:
  ```ts
  timeLimit: null,
  ```
  With:
  ```ts
  timeLimit: 120,
  orderQuota: 8,
  maxWalkoffs: 3,
  ```

  Note: `maxWalkoffs` is already optional on `LevelConfig` so it is safe to add here. `timeLimit: 120` matches the `?? 90` fallback used by the current scene for timer setup; 120 seconds is consistent with `w1_l6` which also has `timeLimit: 120`.

- [ ] Run `npm run build` — confirm no type errors (data files only changed, no scene changes yet)
- [ ] Commit (data files only): `fix: add orderQuota and timeLimit to CrazedCook entries in world4 and world5`

---

## Task 3: CrazedCookLevel narrowing

**File to edit:** `src/scenes/level-types/CrazedCookLevel.ts`

### Steps

- [ ] Update import — change:
  ```ts
  import { LevelConfig } from '../../types'
  ```
  To:
  ```ts
  import { OrderLevelConfig } from '../../types'
  ```

- [ ] Update init signature — change:
  ```ts
  init(data: { level: LevelConfig; profileSlot: number }) {
  ```
  To:
  ```ts
  init(data: { level: OrderLevelConfig; profileSlot: number }) {
  ```

- [ ] Remove `?? 8` fallback — change line 64:
  ```ts
  this.orderQuota = data.level.orderQuota ?? 8
  ```
  To:
  ```ts
  this.orderQuota = data.level.orderQuota
  ```

- [ ] Remove `?? 90` fallback in `create()` — change line 127:
  ```ts
  this.timerEvent = this.setupLevelTimer(this.level.timeLimit ?? 90, this.timerText)
  ```
  To:
  ```ts
  this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
  ```
  (`OrderLevelConfig` guarantees `timeLimit` is `number`, not `number | null`.)

- [ ] Run `npm run build` — confirm no type errors
- [ ] Run `npm run test` — confirm no regressions
- [ ] Commit: `refactor: CrazedCookLevel init narrowed to OrderLevelConfig, remove fallbacks`

---

## Task 4: TimedLevelConfig for 5 scenes

Apply the same mechanical change to all five scenes in one pass: update the import and the `init` signature. No runtime logic changes needed in any of these scenes — they already guard `timeLimit` with `if (this.level.timeLimit)` checks, but the narrowed type ensures the data always supplies a number (all these level entries already have real `timeLimit` values).

**Files to edit:**
- `src/scenes/level-types/DungeonEscapeLevel.ts`
- `src/scenes/level-types/GuildRecruitmentLevel.ts`
- `src/scenes/level-types/MagicRuneTypingLevel.ts`
- `src/scenes/level-types/PotionBrewingLabLevel.ts`
- `src/scenes/level-types/GoblinWhackerLevel.ts`

### Steps — same change in each file

For each file:

- [ ] **DungeonEscapeLevel.ts** — change import and init signature:
  ```ts
  // Before
  import { LevelConfig } from '../../types'
  // ...
  init(data: { level: LevelConfig; profileSlot: number }) {

  // After
  import { TimedLevelConfig } from '../../types'
  // ...
  init(data: { level: TimedLevelConfig; profileSlot: number }) {
  ```

- [ ] **GuildRecruitmentLevel.ts** — change import and init signature:
  ```ts
  // Before
  import { LevelConfig } from '../../types'
  // ...
  init(data: { level: LevelConfig; profileSlot: number }) {

  // After
  import { TimedLevelConfig } from '../../types'
  // ...
  init(data: { level: TimedLevelConfig; profileSlot: number }) {
  ```

- [ ] **MagicRuneTypingLevel.ts** — change import and init signature:
  ```ts
  // Before
  import { LevelConfig } from '../../types'
  // ...
  init(data: { level: LevelConfig; profileSlot: number }) {

  // After
  import { TimedLevelConfig } from '../../types'
  // ...
  init(data: { level: TimedLevelConfig; profileSlot: number }) {
  ```

- [ ] **PotionBrewingLabLevel.ts** — change import and init signature:
  ```ts
  // Before
  import { LevelConfig } from '../../types'
  // ...
  init(data: { level: LevelConfig; profileSlot: number }) {

  // After
  import { TimedLevelConfig } from '../../types'
  // ...
  init(data: { level: TimedLevelConfig; profileSlot: number }) {
  ```

- [ ] **GoblinWhackerLevel.ts** — change import and init signature:
  ```ts
  // Before
  import { LevelConfig, SpellData } from '../../types'
  // ...
  init(data: { level: LevelConfig; profileSlot: number }) {

  // After
  import { TimedLevelConfig, SpellData } from '../../types'
  // ...
  init(data: { level: TimedLevelConfig; profileSlot: number }) {
  ```
  Note: `GoblinWhackerLevel` imports multiple items from `../../types`; only replace `LevelConfig` with `TimedLevelConfig` in the import, keeping `SpellData` intact.

- [ ] Run `npm run build` — confirm no type errors across all 5 scenes
- [ ] Run `npm run test` — confirm no regressions
- [ ] Commit: `refactor: narrow init signatures to TimedLevelConfig for 5 timed level scenes`

---

## Summary of data changes

| File | Entry | Change |
|------|-------|--------|
| `world2.ts` | `w2_l3` | add `castleHp: 5`, `waveCount: 3` |
| `world3.ts` | `w3_l2` | add `castleHp: 5`, `waveCount: 3` |
| `world4.ts` | `w4_l2` | add `castleHp: 5`, `waveCount: 3` |
| `world4.ts` | `w4_l7` | replace `timeLimit: null` with `timeLimit: 120`, add `orderQuota: 8`, `maxWalkoffs: 3` |
| `world5.ts` | `w5_l6` | replace `timeLimit: null` with `timeLimit: 120`, add `orderQuota: 8`, `maxWalkoffs: 3` |

## Summary of scene changes

| Scene | Old init type | New init type | Runtime change? |
|-------|--------------|--------------|----------------|
| `UndeadSiegeLevel` | `LevelConfig` | `SiegeLevelConfig` | Yes — `castleHp` now from data |
| `CrazedCookLevel` | `LevelConfig` | `OrderLevelConfig` | Yes — removes `?? 8` and `?? 90` fallbacks |
| `DungeonEscapeLevel` | `LevelConfig` | `TimedLevelConfig` | No |
| `GuildRecruitmentLevel` | `LevelConfig` | `TimedLevelConfig` | No |
| `MagicRuneTypingLevel` | `LevelConfig` | `TimedLevelConfig` | No |
| `PotionBrewingLabLevel` | `LevelConfig` | `TimedLevelConfig` | No |
| `GoblinWhackerLevel` | `LevelConfig` | `TimedLevelConfig` | No |
