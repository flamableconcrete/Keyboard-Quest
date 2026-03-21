# Follow-Up Migrations Design

**Date:** 2026-03-20
**Status:** Approved

## Goal

Complete the deferred follow-up work from the shared infrastructure plan
(`2026-03-20-shared-infrastructure.md`): migrate all remaining level and boss scenes
to use the new base-class helpers, wire up all defined constants, and apply
the narrowed type interfaces everywhere they apply.

## Scope

Four independent plans, each independently releasable.

---

## Plan 1: Level Timer Migrations

### Summary

Extend `setupLevelTimer` with an optional `onTick` callback, then migrate the
5 remaining level scenes that still have inline countdown timers.

### `setupLevelTimer` extension

Add an optional third parameter:

```typescript
protected setupLevelTimer(
  seconds: number,
  displayText: Phaser.GameObjects.Text,
  onTick?: (remaining: number) => void
): Phaser.Time.TimerEvent
```

`onTick` is called on each tick **after** `timeLeft` is decremented and the
text is updated, with the new `remaining` value. Existing callers
(`GoblinWhackerLevel`, `CrazedCookLevel`) pass no third argument and are
unaffected.

The `BaseLevelScene.test.ts` gains a second `setupLevelTimer` test case
verifying `onTick` is called each tick with the correct `remaining` value.

### Scene migrations

**`DungeonEscapeLevel`, `GuildRecruitmentLevel`, `MagicRuneTypingLevel`,
`PotionBrewingLabLevel`** — straightforward:
- Remove `private timeLeft` field
- Replace inline `time.addEvent` block with `this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)`
- Verify `endLevel` override still calls `this.timerEvent?.remove()`

**`DungeonPlatformerLevel`** — uses `onTick` for color effects:
- Remove `private timeLeft` field
- Replace inline timer with:
  ```typescript
  this.timerEvent = this.setupLevelTimer(
    this.level.timeLimit,
    this.timerText,
    (remaining) => {
      this.timerText.setColor(remaining <= 10 ? '#ff4444' : '#ffffff')
    }
  )
  ```
- Remove the `updateTimerDisplay()` call from `update()` (and the method itself
  if it only contained the color logic)

### Files changed

- `src/scenes/BaseLevelScene.ts` — extend `setupLevelTimer` signature
- `src/scenes/BaseLevelScene.test.ts` — add `onTick` test case
- `src/scenes/level-types/DungeonEscapeLevel.ts`
- `src/scenes/level-types/GuildRecruitmentLevel.ts`
- `src/scenes/level-types/MagicRuneTypingLevel.ts`
- `src/scenes/level-types/PotionBrewingLabLevel.ts`
- `src/scenes/level-types/DungeonPlatformerLevel.ts`

---

## Plan 2: Boss Scene Migrations

### Summary

Migrate 9 remaining boss scenes to `setupBossHP` / `setupBossTimer`. All extend
`BaseBossScene` directly.

### HP migration

All scenes call `this.setupBossHP(wordCount)` using the default
`playerStartHp = 3`. The existing `playerHp = 5` values were a
bug — player HP should be uniform and will eventually be driven by the
character profile. For now `3` matches the level-scene default.

Remove `private bossHp`, `private bossMaxHp`, `private playerHp`,
`private timeLeft` fields. Add `private hp: BossHPState`. Update all
references to use `this.hp.bossHp`, `this.hp.bossMaxHp`, `this.hp.playerHp`.

### Timer migration

Replace each inline `time.addEvent` countdown block with:
```typescript
this.timerEvent = this.setupBossTimer(
  this.level.timeLimit,
  this.timerText,
  () => this.endLevel(false)
)
```

### Special cases

- **`FlashWordBoss`** — no timer; only `setupBossHP` applies
- **`SlimeKingBoss`** — may have an attack timer distinct from the
  countdown-to-defeat timer; read carefully before migrating. Migrate only the
  HP and, if present, the defeat countdown. Leave attack timers untouched.

### Files changed (one task per scene)

- `src/scenes/boss-types/FlashWordBoss.ts`
- `src/scenes/boss-types/BoneKnightBoss.ts`
- `src/scenes/boss-types/GrizzlefangBoss.ts`
- `src/scenes/boss-types/HydraBoss.ts`
- `src/scenes/boss-types/ClockworkDragonBoss.ts`
- `src/scenes/boss-types/SpiderBoss.ts`
- `src/scenes/boss-types/SlimeKingBoss.ts`
- `src/scenes/boss-types/TypemancerBoss.ts`
- `src/scenes/boss-types/DiceLichBoss.ts`

---

## Plan 3: Constant Wiring

### Summary

Wire the three constants that were defined but not fully wired in the
infrastructure plan.

### `SPAWN_OFFSCREEN_MARGIN` (value: 30)

7 occurrences of `width + 30` across 3 scene files and 1 controller:

| File | Sites |
|------|-------|
| `GoblinWhackerLevel.ts` | 3 (lines ~135, 136, 140) |
| `SlimeSplittingLevel.ts` | 1 (line ~57) |
| `UndeadSiegeLevel.ts` | 3 (lines ~70, 71, 75) |
| `WaveController.ts` | 1 (`canvasWidth + 30` ~line 83) |

Each file gets an `import { SPAWN_OFFSCREEN_MARGIN } from '../../constants'`
(or `'../constants'` for the controller). Literals replaced with constant.

Note: `MonsterArenaLevel` uses `width + 100` — a different margin, not this
constant. Leave it.

### `SKELETON_BARRIER_X` (value: 265)

`SkeletonSwarmLevel` has `private readonly BARRIER_X = 265`. Delete the local
field and import `SKELETON_BARRIER_X` from constants. The 5 usages of
`this.BARRIER_X` become `SKELETON_BARRIER_X`.

### `DEFAULT_PLAYER_HP` (value: 3)

Two remaining level scenes still use the literal `3`:
- `MonsterArenaLevel` — field declaration + `init` reset
- `SlimeSplittingLevel` — field declaration + `init` reset

Add import, replace literals.

### Files changed

- `src/scenes/level-types/GoblinWhackerLevel.ts`
- `src/scenes/level-types/SlimeSplittingLevel.ts`
- `src/scenes/level-types/UndeadSiegeLevel.ts`
- `src/controllers/WaveController.ts`
- `src/scenes/level-types/SkeletonSwarmLevel.ts`
- `src/scenes/level-types/MonsterArenaLevel.ts`

---

## Plan 4: Type Narrowing

### Summary

Wire `SiegeLevelConfig` into `UndeadSiegeLevel` (making `castleHp` data-driven)
and apply `TimedLevelConfig` / `OrderLevelConfig` to the 6 remaining level
scenes that access `this.level.timeLimit` or `this.level.orderQuota`.

### `SiegeLevelConfig` + `UndeadSiegeLevel`

`castleHp` moves from a hardcoded local field (`private castleHp = 5`) into the
level config data. Steps:

1. Add `castleHp: 5` to each `UndeadSiege` entry in the world data files
   (grep for `type: 'siege'` or `'UndeadSiege'`)
2. Update `UndeadSiegeLevel.init` to accept `SiegeLevelConfig`
3. Replace `this.castleHp = 5` / `private castleHp = 5` with
   `this.castleHp = data.level.castleHp`
4. Run `npm run build` — TypeScript will catch any data entries missing `castleHp`

### `TimedLevelConfig` / `OrderLevelConfig`

Six `init` signatures updated:

| Scene | New type |
|-------|----------|
| `DungeonEscapeLevel` | `TimedLevelConfig` |
| `GuildRecruitmentLevel` | `TimedLevelConfig` |
| `MagicRuneTypingLevel` | `TimedLevelConfig` |
| `PotionBrewingLabLevel` | `TimedLevelConfig` |
| `GoblinWhackerLevel` | `TimedLevelConfig` |
| `CrazedCookLevel` | `OrderLevelConfig` |

`CrazedCookLevel` also removes the `?? 8` fallback on `orderQuota` since
`OrderLevelConfig` makes it required. Build verifies all data entries have the
field.

### Files changed

- `src/data/levels/world*.ts` (UndeadSiege entries — add `castleHp`)
- `src/scenes/level-types/UndeadSiegeLevel.ts`
- `src/scenes/level-types/DungeonEscapeLevel.ts`
- `src/scenes/level-types/GuildRecruitmentLevel.ts`
- `src/scenes/level-types/MagicRuneTypingLevel.ts`
- `src/scenes/level-types/PotionBrewingLabLevel.ts`
- `src/scenes/level-types/GoblinWhackerLevel.ts`
- `src/scenes/level-types/CrazedCookLevel.ts`
